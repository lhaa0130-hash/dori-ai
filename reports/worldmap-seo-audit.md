# 나라콕 — SEO route 감사

`npm run audit:worldmap:seo` · **빌드 산출물 `out/` 의 실제 HTML** 을 읽어 검사한다.
코드를 보고 판단하지 않는다 — 정적 export 라 out/ 의 바이트가 곧 crawler 가 받는 것이다.

## 요약

- 검사한 URL: **130**
- 문제 없음: **130**
- 문제 있음: **0**
- title 중복: **0**
- description 중복: **0**
- 내부 링크 평균: **49개**
- 본문 평균 길이: **1424자**

> 모든 URL 통과.

## URL 별 결과

| URL | status | H1 | 링크 | 본문자수 | JSON-LD | hreflang | 문제 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| /world-map | 200 | 나라콕 | 31 | 695 | 2 | 3 | - |
| /en/world-map | 200 | NARAKOK | 27 | 931 | 2 | 3 | - |
| /world-map/countries | 200 | 세계 195개국 목록 | 230 | 1710 | 2 | 3 | - |
| /en/world-map/countries | 200 | All 195 countries | 228 | 2950 | 2 | 3 | - |
| /world-map/countries/argentina | 200 | 아르헨티나은 어떤 나라일까? | 41 | 1454 | 3 | 3 | - |
| /en/world-map/countries/argentina | 200 | What is Argentina like? | 39 | 2262 | 3 | 3 | - |
| /world-map/countries/australia | 200 | 호주은 어떤 나라일까? | 42 | 1411 | 3 | 3 | - |
| /en/world-map/countries/australia | 200 | What is Australia like? | 40 | 2171 | 3 | 3 | - |
| /world-map/countries/brazil | 200 | 브라질은 어떤 나라일까? | 47 | 1499 | 3 | 3 | - |
| /en/world-map/countries/brazil | 200 | What is Brazil like? | 45 | 2312 | 3 | 3 | - |
| /world-map/countries/canada | 200 | 캐나다은 어떤 나라일까? | 43 | 1414 | 3 | 3 | - |
| /en/world-map/countries/canada | 200 | What is Canada like? | 41 | 2270 | 3 | 3 | - |
| /world-map/countries/china | 200 | 중국은 어떤 나라일까? | 59 | 1596 | 3 | 3 | - |
| /en/world-map/countries/china | 200 | What is China like? | 57 | 2466 | 3 | 3 | - |
| /world-map/countries/germany | 200 | 독일은 어떤 나라일까? | 48 | 1420 | 3 | 3 | - |
| /en/world-map/countries/germany | 200 | What is Germany like? | 46 | 2239 | 3 | 3 | - |
| /world-map/countries/egypt | 200 | 이집트은 어떤 나라일까? | 44 | 1424 | 3 | 3 | - |
| /en/world-map/countries/egypt | 200 | What is Egypt like? | 42 | 2195 | 3 | 3 | - |
| /world-map/countries/spain | 200 | 스페인은 어떤 나라일까? | 44 | 1408 | 3 | 3 | - |
| /en/world-map/countries/spain | 200 | What is Spain like? | 42 | 2211 | 3 | 3 | - |
| /world-map/countries/france | 200 | 프랑스은 어떤 나라일까? | 46 | 1412 | 3 | 3 | - |
| /en/world-map/countries/france | 200 | What is France like? | 44 | 2208 | 3 | 3 | - |
| /world-map/countries/united-kingdom | 200 | 영국은 어떤 나라일까? | 43 | 1388 | 3 | 3 | - |
| /en/world-map/countries/united-kingdom | 200 | What is United Kingdom like? | 41 | 2218 | 3 | 3 | - |
| /world-map/countries/indonesia | 200 | 인도네시아은 어떤 나라일까? | 45 | 1564 | 3 | 3 | - |
| /en/world-map/countries/indonesia | 200 | What is Indonesia like? | 43 | 2475 | 3 | 3 | - |
| /world-map/countries/india | 200 | 인도은 어떤 나라일까? | 47 | 1466 | 3 | 3 | - |
| /en/world-map/countries/india | 200 | What is India like? | 45 | 2281 | 3 | 3 | - |
| /world-map/countries/italy | 200 | 이탈리아은 어떤 나라일까? | 48 | 1461 | 3 | 3 | - |
| /en/world-map/countries/italy | 200 | What is Italy like? | 46 | 2291 | 3 | 3 | - |
| /world-map/countries/japan | 200 | 일본은 어떤 나라일까? | 43 | 1416 | 3 | 3 | - |
| /en/world-map/countries/japan | 200 | What is Japan like? | 41 | 2139 | 3 | 3 | - |
| /world-map/countries/kenya | 200 | 케냐은 어떤 나라일까? | 46 | 1491 | 3 | 3 | - |
| /en/world-map/countries/kenya | 200 | What is Kenya like? | 44 | 2343 | 3 | 3 | - |
| /world-map/countries/south-korea | 200 | 대한민국은 어떤 나라일까? | 40 | 1408 | 3 | 3 | - |
| /en/world-map/countries/south-korea | 200 | What is South Korea like? | 38 | 2176 | 3 | 3 | - |
| /world-map/countries/morocco | 200 | 모로코은 어떤 나라일까? | 42 | 1385 | 3 | 3 | - |
| /en/world-map/countries/morocco | 200 | What is Morocco like? | 40 | 2198 | 3 | 3 | - |
| /world-map/countries/mexico | 200 | 멕시코은 어떤 나라일까? | 39 | 1324 | 3 | 3 | - |
| /en/world-map/countries/mexico | 200 | What is Mexico like? | 37 | 2072 | 3 | 3 | - |
| /world-map/countries/nigeria | 200 | 나이지리아은 어떤 나라일까? | 44 | 1421 | 3 | 3 | - |
| /en/world-map/countries/nigeria | 200 | What is Nigeria like? | 42 | 2159 | 3 | 3 | - |
| /world-map/countries/new-zealand | 200 | 뉴질랜드은 어떤 나라일까? | 40 | 1409 | 3 | 3 | - |
| /en/world-map/countries/new-zealand | 200 | What is New Zealand like? | 38 | 2225 | 3 | 3 | - |
| /world-map/countries/peru | 200 | 페루은 어떤 나라일까? | 41 | 1404 | 3 | 3 | - |
| /en/world-map/countries/peru | 200 | What is Peru like? | 39 | 2202 | 3 | 3 | - |
| /world-map/countries/north-korea | 200 | 조선민주주의인민공화국은 어떤 나라일까? | 41 | 1398 | 3 | 3 | - |
| /en/world-map/countries/north-korea | 200 | What is North Korea like? | 39 | 2101 | 3 | 3 | - |
| /world-map/countries/russia | 200 | 러시아은 어떤 나라일까? | 56 | 1496 | 3 | 3 | - |
| /en/world-map/countries/russia | 200 | What is Russia like? | 54 | 2292 | 3 | 3 | - |
| /world-map/countries/singapore | 200 | 싱가포르은 어떤 나라일까? | 48 | 1555 | 3 | 3 | - |
| /en/world-map/countries/singapore | 200 | What is Singapore like? | 46 | 2446 | 3 | 3 | - |
| /world-map/countries/suriname | 200 | 수리남은 어떤 나라일까? | 41 | 1390 | 3 | 3 | - |
| /en/world-map/countries/suriname | 200 | What is Suriname like? | 39 | 2166 | 3 | 3 | - |
| /world-map/countries/thailand | 200 | 태국은 어떤 나라일까? | 42 | 1370 | 3 | 3 | - |
| /en/world-map/countries/thailand | 200 | What is Thailand like? | 40 | 2130 | 3 | 3 | - |
| /world-map/countries/tonga | 200 | 통가은 어떤 나라일까? | 41 | 1371 | 3 | 3 | - |
| /en/world-map/countries/tonga | 200 | What is Tonga like? | 39 | 2146 | 3 | 3 | - |
| /world-map/countries/united-states | 200 | 미국은 어떤 나라일까? | 41 | 1434 | 3 | 3 | - |
| /en/world-map/countries/united-states | 200 | What is United States like? | 39 | 2282 | 3 | 3 | - |
| /world-map/countries/vietnam | 200 | 베트남은 어떤 나라일까? | 41 | 1354 | 3 | 3 | - |
| /en/world-map/countries/vietnam | 200 | What is Vietnam like? | 39 | 2075 | 3 | 3 | - |
| /world-map/countries/south-africa | 200 | 남아프리카은 어떤 나라일까? | 48 | 1578 | 3 | 3 | - |
| /en/world-map/countries/south-africa | 200 | What is South Africa like? | 46 | 2499 | 3 | 3 | - |
| /world-map/continents/asia | 200 | 아시아에는 어떤 나라가 있을까? | 77 | 971 | 3 | 3 | - |
| /en/world-map/continents/asia | 200 | Which countries are in Asia? | 74 | 1465 | 3 | 3 | - |
| /world-map/continents/europe | 200 | 유럽에는 어떤 나라가 있을까? | 75 | 958 | 3 | 3 | - |
| /en/world-map/continents/europe | 200 | Which countries are in Europe? | 72 | 1463 | 3 | 3 | - |
| /world-map/continents/africa | 200 | 아프리카에는 어떤 나라가 있을까? | 84 | 1003 | 3 | 3 | - |
| /en/world-map/continents/africa | 200 | Which countries are in Africa? | 81 | 1564 | 3 | 3 | - |
| /world-map/continents/north-america | 200 | 북아메리카에는 어떤 나라가 있을까? | 53 | 887 | 3 | 3 | - |
| /en/world-map/continents/north-america | 200 | Which countries are in North A | 50 | 1363 | 3 | 3 | - |
| /world-map/continents/south-america | 200 | 남아메리카에는 어떤 나라가 있을까? | 42 | 805 | 3 | 3 | - |
| /en/world-map/continents/south-america | 200 | Which countries are in South A | 39 | 1185 | 3 | 3 | - |
| /world-map/continents/oceania | 200 | 오세아니아에는 어떤 나라가 있을까? | 44 | 815 | 3 | 3 | - |
| /en/world-map/continents/oceania | 200 | Which countries are in Oceania | 41 | 1196 | 3 | 3 | - |
| /world-map/rankings/area | 200 | 어느 나라가 가장 클까? | 40 | 863 | 3 | 3 | - |
| /en/world-map/rankings/area | 200 | Which country is the largest? | 37 | 1162 | 3 | 3 | - |
| /world-map/rankings/population | 200 | 사람이 가장 많이 사는 나라는? | 40 | 883 | 3 | 3 | - |
| /en/world-map/rankings/population | 200 | Which country has the most peo | 37 | 1201 | 3 | 3 | - |
| /world-map/rankings/population-density | 200 | 사람들이 가장 빽빽하게 사는 나라는? | 40 | 904 | 3 | 3 | - |
| /en/world-map/rankings/population-density | 200 | Where do people live most clos | 37 | 1237 | 3 | 3 | - |
| /world-map/rankings/border-country-count | 200 | 이웃 나라가 가장 많은 나라는? | 40 | 791 | 3 | 3 | - |
| /en/world-map/rankings/border-country-count | 200 | Which country has the most lan | 37 | 1109 | 3 | 3 | - |
| /world-map/rankings/timezone-count | 200 | 시간대가 가장 많은 나라는? | 40 | 829 | 3 | 3 | - |
| /en/world-map/rankings/timezone-count | 200 | Which country has the most tim | 37 | 1111 | 3 | 3 | - |
| /world-map/rankings/official-language-count | 200 | 공식 언어가 가장 많은 나라는? | 40 | 803 | 3 | 3 | - |
| /en/world-map/rankings/official-language-count | 200 | Which country has the most off | 37 | 1134 | 3 | 3 | - |
| /world-map/rankings/capital-equator-distance | 200 | 어느 수도가 적도와 가장 가까울까? | 40 | 880 | 3 | 3 | - |
| /en/world-map/rankings/capital-equator-distance | 200 | Which capital is closest to th | 37 | 1206 | 3 | 3 | - |
| /world-map/rankings/gdp | 200 | 경제 규모가 큰 나라는? | 40 | 1046 | 3 | 3 | - |
| /en/world-map/rankings/gdp | 200 | Which country has the largest  | 37 | 1284 | 3 | 3 | - |
| /world-map/rankings/gdp-per-capita | 200 | 1인당 GDP가 높은 나라는? | 40 | 929 | 3 | 3 | - |
| /en/world-map/rankings/gdp-per-capita | 200 | Which country has the highest  | 37 | 1254 | 3 | 3 | - |
| /world-map/rankings/gdp-growth | 200 | 경제 규모가 빠르게 변한 나라는? | 40 | 832 | 3 | 3 | - |
| /en/world-map/rankings/gdp-growth | 200 | Where did the economy change f | 37 | 1134 | 3 | 3 | - |
| /world-map/rankings/life-expectancy | 200 | 평균적으로 오래 사는 나라는? | 40 | 824 | 3 | 3 | - |
| /en/world-map/rankings/life-expectancy | 200 | Where do people live longest o | 37 | 1132 | 3 | 3 | - |
| /world-map/rankings/internet-usage-rate | 200 | 인터넷을 사용하는 사람이 많은 나라는? | 40 | 845 | 3 | 3 | - |
| /en/world-map/rankings/internet-usage-rate | 200 | Where do the most people use t | 37 | 1171 | 3 | 3 | - |
| /world-map/rankings/urban-population-rate | 200 | 도시에 사는 사람이 많은 나라는? | 40 | 822 | 3 | 3 | - |
| /en/world-map/rankings/urban-population-rate | 200 | Where do the most people live  | 37 | 1133 | 3 | 3 | - |
| /world-map/rankings/birth-rate | 200 | 아기가 많이 태어나는 나라는? | 40 | 826 | 3 | 3 | - |
| /en/world-map/rankings/birth-rate | 200 | Where are the most babies born | 37 | 1115 | 3 | 3 | - |
| /world-map/rankings/child-population-rate | 200 | 어린이가 차지하는 비율이 높은 나라는? | 40 | 835 | 3 | 3 | - |
| /en/world-map/rankings/child-population-rate | 200 | Where is the share of children | 37 | 1132 | 3 | 3 | - |
| /world-map/rankings/forest-area-rate | 200 | 국토에서 숲이 차지하는 비율이 큰 나라는? | 40 | 833 | 3 | 3 | - |
| /en/world-map/rankings/forest-area-rate | 200 | Where does forest cover the mo | 37 | 1146 | 3 | 3 | - |
| /world-map/rankings/renewable-energy-rate | 200 | 재생에너지를 많이 사용하는 나라는? | 40 | 852 | 3 | 3 | - |
| /en/world-map/rankings/renewable-energy-rate | 200 | Which countries use the most r | 37 | 1212 | 3 | 3 | - |
| /world-map/rankings/co2-per-capita | 200 | 한 사람당 이산화탄소 배출량은? | 40 | 846 | 3 | 3 | - |
| /en/world-map/rankings/co2-per-capita | 200 | How much CO₂ is emitted per pe | 37 | 1153 | 3 | 3 | - |
| /world-map/curiosities/island-countries | 200 | 바다에 둘러싸인 섬나라 | 69 | 853 | 3 | 3 | - |
| /en/world-map/curiosities/island-countries | 200 | Island countries | 66 | 1295 | 3 | 3 | - |
| /world-map/curiosities/landlocked-countries | 200 | 바다가 없는 내륙국 | 74 | 851 | 3 | 3 | - |
| /en/world-map/curiosities/landlocked-countries | 200 | Landlocked countries | 71 | 1279 | 3 | 3 | - |
| /world-map/curiosities/countries-on-the-equator | 200 | 적도가 지나가는 나라 | 40 | 757 | 3 | 3 | - |
| /en/world-map/curiosities/countries-on-the-equator | 200 | Countries on the equator | 37 | 980 | 3 | 3 | - |
| /world-map/curiosities/countries-with-one-neighbour | 200 | 이웃 나라가 딱 하나인 나라 | 47 | 729 | 3 | 3 | - |
| /en/world-map/curiosities/countries-with-one-neighbour | 200 | Countries with exactly one nei | 44 | 1115 | 3 | 3 | - |
| /world-map/curiosities/doubly-landlocked-countries | 200 | 두 겹 내륙국 | 32 | 670 | 3 | 3 | - |
| /en/world-map/curiosities/doubly-landlocked-countries | 200 | Doubly landlocked countries | 29 | 938 | 3 | 3 | - |
| /world-map/curiosities/multilingual-countries | 200 | 공식 언어가 둘 이상인 나라 | 106 | 1029 | 3 | 3 | - |
| /en/world-map/curiosities/multilingual-countries | 200 | Countries with two or more off | 103 | 1681 | 3 | 3 | - |
| /world-map/curiosities/countries-with-many-time-zones | 200 | 시간대가 여러 개인 나라 | 38 | 680 | 3 | 3 | - |
| /en/world-map/curiosities/countries-with-many-time-zones | 200 | Countries with multiple time z | 35 | 989 | 3 | 3 | - |
| /world-map/curiosities/countries-sharing-a-currency | 200 | 다른 나라와 통화를 함께 쓰는 나라 | 107 | 1047 | 3 | 3 | - |
| /en/world-map/curiosities/countries-sharing-a-currency | 200 | Countries sharing a currency | 104 | 1688 | 3 | 3 | - |
| /world-map/curiosities/capital-same-name-as-country | 200 | 수도와 나라 이름이 같은 나라 | 36 | 674 | 3 | 3 | - |
| /en/world-map/curiosities/capital-same-name-as-country | 200 | Countries whose capital shares | 33 | 1014 | 3 | 3 | - |
