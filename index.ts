import fs from "fs";

import fetch from "isomorphic-fetch";

let items = [];

const chars = "qwertyuiopasdfghjklzxcvbnm".split("").sort();


async function getSkills(keyword: string): Promise<any>{
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
          "x-li-page-instance": "urn:li:page:d_flagship3_profile_self_add_skill_associations;PyPOtWEsQ8iKr3cAawySbw==",
          "x-li-track": "{\"clientVersion\":\"1.12.9761\",\"mpVersion\":\"1.12.9761\",\"osName\":\"web\",\"timezoneOffset\":-4,\"timezone\":\"America/New_York\",\"deviceFormFactor\":\"DESKTOP\",\"mpName\":\"voyager-web\",\"displayDensity\":1,\"displayWidth\":2560,\"displayHeight\":1440}",
          "x-restli-protocol-version": "2.0.0",
          "cookie": "bcookie=\"v=2&dfbca486-11d5-47b2-8a07-0e4ceb03b81b\"; bscookie=\"v=1&20220527040222d334207d-9f12-422e-8f71-e3e258e64a52AQEwQtUaWmNiMZJY1eNtYo8uI7-6ZnYs\"; G_ENABLED_IDPS=google; liap=true; JSESSIONID=\"ajax:7536234223989958482\"; li_theme=light; li_theme_set=app; timezone=America/New_York; li_at=AQEDAQ3ZDoEFOzvuAAABgRMxs0wAAAGJk6QsjFYAd6AW-_OuzVQgLa2ku5r4X2aP2rnabvVhRkfB_n2pP2JVTxsFp2hyZ3LevvfeL5R4NWXsYp5YZ1dDXvECL7Jh-JkLTauXLUz8pmxa3dMlJcrtAnm2; lang=v=2&lang=en-us; lidc=\"b=TB33:s=T:r=T:a=T:p=T:g=3899:u=1111:x=1:i=1690252711:t=1690338743:v=2:sig=AQFypSR-pLhENI1m5_ArSWuONIEArnHl\"; li_mc=MTs0MjsxNjkwMjU0MjA5OzE7MDIx0MQiRFrirc3oy8TTPEpOpQo0A4c/Qn1B7jhvvqA8d/s=",
          "Referer": "https://www.linkedin.com/in/actuallydan/details/skills/edit/forms/new/?profileFormEntryPoint=PROFILE_SECTION",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
      });
}

async function* run(length: number = 1): AsyncGenerator<void | string[]> {

    const strs = generateCombinations(length || 1);

    for(let i = 0; i < strs.length; i++){
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

    if(n === 1){
        return combinations;
    }
  
    // 2 character combinations
    for (let i = 0; i < alphabet.length; i++) {
      for (let j = 0; j < alphabet.length; j++) {
        combinations.push(alphabet[i] + alphabet[j]);
      }
    }

    if(n === 2) {
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


(async function(){
    const iterator =  run(3);
    let res = await iterator.next();
    while(!res.done){
        res = await iterator.next();
        console.log(res.value)

       items = items.concat(res.value)
    }

    const dedupedItems = new Set<string>(items);
    fs.writeFileSync("skills.json", JSON.stringify([...dedupedItems], null, 2))
})()


// shout out to https://app.quicktype.io/ for generating these types from the API response

export interface LinkedInSkillsResult {
    data?:     LinkedInSkillsResultData;
    included?: Included[];
}

export interface LinkedInSkillsResultData {
    data?: DataData;
}

export interface DataData {
    searchDashReusableTypeaheadByType?: SearchDashReusableTypeaheadByType;
    $recipeTypes?:                      string[];
    $type?:                             string;
}

export interface SearchDashReusableTypeaheadByType {
    metadata?:     Metadata;
    paging?:       Paging;
    $recipeTypes?: string[];
    elements?:     Element[];
    $type?:        string;
}

export interface Element {
    image?:         null;
    trackingUrn?:   string;
    subtitle?:      null;
    navigationUrl?: null;
    title?:         Title;
    $recipeTypes?:  string[];
    trackingId?:    string;
    target?:        Target;
    $type?:         string;
}

export interface Target {
    address?:               null;
    gender?:                null;
    race?:                  null;
    profile?:               null;
    segmentAttributeValue?: null;
    degree?:                null;
    professionalEvent?:     null;
    industry?:              null;
    title?:                 null;
    profileSkill?:          null;
    productCategory?:       null;
    geo?:                   null;
    sexualOrientation?:     null;
    industryV2?:            null;
    jobFunction?:           null;
    credential?:            null;
    organizationProduct?:   null;
    "*skill"?:              string;
    standardizedProduct?:   null;
    company?:               null;
    fieldOfStudy?:          null;
    group?:                 null;
    hashtag?:               null;
}

export interface Title {
    textDirection?:                 string;
    text?:                          string;
    attributesV2?:                  any[];
    accessibilityTextAttributesV2?: any[];
    accessibilityText?:             null;
    $recipeTypes?:                  string[];
    $type?:                         string;
}

export interface Metadata {
    searchId?:     string;
    $recipeTypes?: string[];
    $type?:        string;
}

export interface Paging {
    count?:        number;
    start?:        number;
    total?:        number;
    $recipeTypes?: string[];
    $type?:        string;
}

export interface Included {
    entityUrn?:    string;
    $recipeTypes?: string[];
    $type?:        string;
}