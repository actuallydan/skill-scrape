import fs from "fs";

import fetch from "isomorphic-fetch";

async function getSkills(keyword: string): Promise<any> {
  return fetch(`https://www.linkedin.com/voyager/api/graphql?variables=(keywords:${keyword},query:(typeaheadFilterQuery:()),type:SKILL)&&queryId=voyagerSearchDashReusableTypeahead.1043b2d44b336397a7560ac3243a89a0`, {
    "headers": {
      "accept": "application/vnd.linkedin.normalized+json+2.1",
      "accept-language": "en-US,en;q=0.9",
      "csrf-token": "ajax:7536234223989958482",
      "sec-ch-ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-li-lang": "en_US",
      "x-li-page-instance": "urn:li:page:d_flagship3_profile_self_add_skill_associations;xuT5dr0CTZyp8Q0ABtOVsg==",
      "x-li-track": "{\"clientVersion\":\"1.12.9761\",\"mpVersion\":\"1.12.9761\",\"osName\":\"web\",\"timezoneOffset\":-4,\"timezone\":\"America/New_York\",\"deviceFormFactor\":\"DESKTOP\",\"mpName\":\"voyager-web\",\"displayDensity\":1,\"displayWidth\":2560,\"displayHeight\":1440}",
      "x-restli-protocol-version": "2.0.0",
      "cookie": "bcookie=\"v=2&dfbca486-11d5-47b2-8a07-0e4ceb03b81b\"; bscookie=\"v=1&20220527040222d334207d-9f12-422e-8f71-e3e258e64a52AQEwQtUaWmNiMZJY1eNtYo8uI7-6ZnYs\"; G_ENABLED_IDPS=google; liap=true; JSESSIONID=\"ajax:7536234223989958482\"; li_theme=light; li_theme_set=app; timezone=America/New_York; li_at=AQEDAQ3ZDoEFOzvuAAABgRMxs0wAAAGJk6QsjFYAd6AW-_OuzVQgLa2ku5r4X2aP2rnabvVhRkfB_n2pP2JVTxsFp2hyZ3LevvfeL5R4NWXsYp5YZ1dDXvECL7Jh-JkLTauXLUz8pmxa3dMlJcrtAnm2; lang=v=2&lang=en-us; li_mc=MTs0MjsxNjkwMjY4NDMwOzE7MDIxdPfSCFyK5fxdsGQZ9i75zXiz/DAry7cFFu7xUFEGjZg=; lidc=\"b=TB33:s=T:r=T:a=T:p=T:g=3902:u=1111:x=1:i=1690268773:t=1690352651:v=2:sig=AQHhcC5OF4CG3c5WsOANyT1njSz_A9UL\"",
      "Referer": "https://www.linkedin.com/in/actuallydan/details/skills/edit/forms/new/?profileFormEntryPoint=PROFILE_SECTION",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": null,
    "method": "GET"
  });
}

// previously used sync function, works great but I'd rather use parallelization
async function* run(length: number = 1): AsyncGenerator<void | string[]> {

  const strs = generateCombinations(length || 1);

  for (let i = 0; i < strs.length; i++) {
    const res = await getSkills(strs[i]);
    // console.log(res);
    const data: LinkedInSkillsResult = await res.json();
    // console.log(data.data.data.searchDashReusableTypeaheadByType.elements)
    yield data.data.data.searchDashReusableTypeaheadByType.elements.map(n => n.title.text);
  }
};

function generateCombinations(n: number) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const combinations = [];

  // Single character combinations (characters in the English alphabet)
  for (let i = 0; i < alphabet.length; i++) {
    combinations.push(alphabet[i]);
  }

  if (n === 1) {
    return combinations;
  }

  // 2 character combinations
  for (let i = 0; i < alphabet.length; i++) {
    for (let j = 0; j < alphabet.length; j++) {
      combinations.push(alphabet[i] + alphabet[j]);
    }
  }

  if (n === 2) {
    return combinations;
  }

  // 3 to n character combinations
  for (let length = 3; length <= n; length++) {
    const prevCombinations = combinations.slice(-Math.pow(26, length - 1));

    for (let i = 0; i < alphabet.length; i++) {
      for (const prevCombination of prevCombinations) {
        combinations.push(alphabet[i] + prevCombination);
      }
    }
  }

  return combinations;
}

// start at 49150 (cvvx for latest set)
(async function () {
  const concurrency = 5; // Adjust the concurrency level as needed
  const searchTerms = generateCombinations(4); // Generate combinations up to length 4

  for (let i = 68190; i < searchTerms.length; i += concurrency) {
   try { 
    const batchTerms = searchTerms.slice(i, i + concurrency);
    const promises = batchTerms.map((term) => getSkills(term));
    const results = await Promise.all(promises);

    let skills = [];

    // Process the results as needed
    for (const result of results) {
      const data: LinkedInSkillsResult = await result.json();
      skills = data.data.data.searchDashReusableTypeaheadByType.elements.map(n => n.title.text)

      if (skills && skills.length > 0) {
        fs.appendFileSync("skills_results.txt", skills.join(",,") + ",,");

        console.log(`processed terms for ${batchTerms[0]} - ${batchTerms[batchTerms.length - 1]}`)

      }
    }} catch (err) {
      console.error(err);
      // wait a bit and try again
      await sleep(2000);
      i -= concurrency;
    }
  }

  
  // Read from "skills_results.txt" and deduplicate the skills
  const allSkills = fs.readFileSync("skills_results.txt", "utf-8").split(",,").filter(Boolean);
  const deduplicatedSkills = [...new Set(allSkills)];

  // Write the deduplicated skills to "skills_final.json"
  fs.writeFileSync("skills_final.json", JSON.stringify(deduplicatedSkills, null, 2));

  console.log("All tasks completed!");
})();

function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  })
}

// shout out to https://app.quicktype.io/ for generating these types from the API response

export interface LinkedInSkillsResult {
  data?: LinkedInSkillsResultData;
  included?: Included[];
}

export interface LinkedInSkillsResultData {
  data?: DataData;
}

export interface DataData {
  searchDashReusableTypeaheadByType?: SearchDashReusableTypeaheadByType;
  $recipeTypes?: string[];
  $type?: string;
}

export interface SearchDashReusableTypeaheadByType {
  metadata?: Metadata;
  paging?: Paging;
  $recipeTypes?: string[];
  elements?: Element[];
  $type?: string;
}

export interface Element {
  image?: null;
  trackingUrn?: string;
  subtitle?: null;
  navigationUrl?: null;
  title?: Title;
  $recipeTypes?: string[];
  trackingId?: string;
  target?: Target;
  $type?: string;
}

export interface Target {
  address?: null;
  gender?: null;
  race?: null;
  profile?: null;
  segmentAttributeValue?: null;
  degree?: null;
  professionalEvent?: null;
  industry?: null;
  title?: null;
  profileSkill?: null;
  productCategory?: null;
  geo?: null;
  sexualOrientation?: null;
  industryV2?: null;
  jobFunction?: null;
  credential?: null;
  organizationProduct?: null;
  "*skill"?: string;
  standardizedProduct?: null;
  company?: null;
  fieldOfStudy?: null;
  group?: null;
  hashtag?: null;
}

export interface Title {
  textDirection?: string;
  text?: string;
  attributesV2?: any[];
  accessibilityTextAttributesV2?: any[];
  accessibilityText?: null;
  $recipeTypes?: string[];
  $type?: string;
}

export interface Metadata {
  searchId?: string;
  $recipeTypes?: string[];
  $type?: string;
}

export interface Paging {
  count?: number;
  start?: number;
  total?: number;
  $recipeTypes?: string[];
  $type?: string;
}

export interface Included {
  entityUrn?: string;
  $recipeTypes?: string[];
  $type?: string;
}