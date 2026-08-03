# 나라콕 — 195개국 한국어 표기 전수 감사

생성: `npm run audit:worldmap:ko` · 대상 195개국

이 보고서는 데이터 필드가 아니라 **실제 화면에 나가는 문장**을 재현해 검사한다.
자동 검사 뒤 사람이 처음부터 끝까지 읽고 REVIEW 승인 여부를 남긴다.

## 요약

- PASS: **154**
- REVIEW: **41**
- FAIL: **0**
- 영문 원문 허용: **46건**

> FAIL 0건. 조사·표기 자동 검사를 모두 통과했다.

## 영문 원문 허용 사유 (§7)

정규식상 영문을 0개로 만드는 것이 목표가 아니다. 공인 한국어 표기를 찾지 못한
고유명사는 **임의 음역하지 않고** 영문 원문을 남기며, 그 사유를 여기에 기록한다.

| 필드 | 건수 | 허용 사유 |
| --- | --- | --- |
| `leader.ko` | 38 | 공인 한국어 표기가 없는 현직 지도자 인명 — 임의 음역 금지 |
| `languages[].ko` | 6 | 공인 한국어 언어명이 없음 |
| `religion.ko` | 2 | 공인 한국어 표기가 없는 종교명 |

## 국가별 상세

| ISO3 | 국가명 | 설명 | 이웃 | 수도 | 지역 | 지도자 | 통화 | 시간대 | 랭킹 | 상태 | 비고 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AFG | 아프가니스탄 | O | O | O | O | O | O | O | O | PASS |  |
| AGO | 앙골라 | O | O | O | O | O | O | O | O | PASS |  |
| ALB | 알바니아 | O | O | O | O | O | O | O | O | PASS |  |
| AND | 안도라 | O | O | O | O | O | O | O | O | PASS |  |
| ARE | 아랍에미리트 | O | O | O | O | O | O | O | O | PASS |  |
| ARG | 아르헨티나 | O | O | O | O | O | O | O | O | PASS |  |
| ARM | 아르메니아 | O | O | O | O | O | O | O | O | PASS |  |
| ATG | 앤티가 바부다 | O | O | O | O | O | O | O | O | PASS |  |
| AUS | 호주 | O | O | O | O | O | O | O | O | PASS |  |
| AUT | 오스트리아 | O | O | O | O | O | O | O | O | PASS |  |
| AZE | 아제르바이잔 | O | O | O | O | O | O | O | O | PASS |  |
| BDI | 부룬디 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| BEL | 벨기에 | O | O | O | O | O | O | O | O | PASS |  |
| BEN | 베냉 | O | O | O | O | O | O | O | O | PASS |  |
| BFA | 부르키나파소 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| BGD | 방글라데시 | O | O | O | O | O | O | O | O | PASS |  |
| BGR | 불가리아 | O | O | O | O | O | O | O | O | PASS |  |
| BHR | 바레인 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| BHS | 바하마 | O | O | O | O | O | O | O | O | PASS |  |
| BIH | 보스니아 헤르체고비나 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| BLR | 벨라루스 | O | O | O | O | O | O | O | O | PASS |  |
| BLZ | 벨리즈 | O | O | O | O | O | O | O | O | PASS |  |
| BOL | 볼리비아 | O | O | O | O | O | O | O | O | PASS |  |
| BRA | 브라질 | O | O | O | O | O | O | O | O | PASS |  |
| BRB | 바베이도스 | O | O | O | O | O | O | O | O | PASS |  |
| BRN | 브루나이 | O | O | O | O | O | O | O | O | PASS |  |
| BTN | 부탄 | O | O | O | O | O | O | O | O | PASS |  |
| BWA | 보츠와나 | O | O | O | O | O | O | O | O | PASS |  |
| CAF | 중앙아프리카공화국 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| CAN | 캐나다 | O | O | O | O | O | O | O | O | PASS |  |
| CHE | 스위스 | O | O | O | O | O | O | O | O | PASS |  |
| CHL | 칠레 | O | O | O | O | O | O | O | O | PASS |  |
| CHN | 중국 | O | O | O | O | O | O | O | O | PASS |  |
| CIV | 코트디부아르 | O | O | O | O | O | O | O | O | PASS |  |
| CMR | 카메룬 | O | O | O | O | O | O | O | O | PASS |  |
| COD | 콩고민주공화국 | O | O | O | O | O | O | O | O | PASS |  |
| COG | 콩고 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| COL | 콜롬비아 | O | O | O | O | O | O | O | O | PASS |  |
| COM | 코모로 | O | O | O | O | O | O | O | O | PASS |  |
| CPV | 카보베르데 | O | O | O | O | O | O | O | O | PASS |  |
| CRI | 코스타리카 | O | O | O | O | O | O | O | O | PASS |  |
| CUB | 쿠바 | O | O | O | O | O | O | O | O | PASS |  |
| CYP | 키프로스 | O | O | O | O | O | O | O | O | PASS |  |
| CZE | 체코 | O | O | O | O | O | O | O | O | PASS |  |
| DEU | 독일 | O | O | O | O | O | O | O | O | PASS |  |
| DJI | 지부티 | O | O | O | O | O | O | O | O | PASS |  |
| DMA | 도미니카 연방 | O | O | O | O | O | O | O | O | PASS |  |
| DNK | 덴마크 | O | O | O | O | O | O | O | O | PASS |  |
| DOM | 도미니카 공화국 | O | O | O | O | O | O | O | O | PASS |  |
| DZA | 알제리 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| ECU | 에콰도르 | O | O | O | O | O | O | O | O | PASS |  |
| EGY | 이집트 | O | O | O | O | O | O | O | O | PASS |  |
| ERI | 에리트레아 | O | O | O | O | O | O | O | O | PASS |  |
| ESP | 스페인 | O | O | O | O | O | O | O | O | REVIEW | religion.ko 영문 허용 |
| EST | 에스토니아 | O | O | O | O | O | O | O | O | PASS |  |
| ETH | 에티오피아 | O | O | O | O | O | O | O | O | PASS |  |
| FIN | 핀란드 | O | O | O | O | O | O | O | O | PASS |  |
| FJI | 피지 | O | O | O | O | O | O | O | O | PASS |  |
| FRA | 프랑스 | O | O | O | O | O | O | O | O | PASS |  |
| FSM | 미크로네시아 | O | O | O | O | O | - | O | O | PASS |  |
| GAB | 가봉 | O | O | O | O | O | O | O | O | PASS |  |
| GBR | 영국 | O | O | O | O | O | O | O | O | PASS |  |
| GEO | 조지아 | O | O | O | O | O | O | O | O | PASS |  |
| GHA | 가나 | O | O | O | O | O | O | O | O | PASS |  |
| GIN | 기니 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| GMB | 감비아 | O | O | O | O | O | O | O | O | PASS |  |
| GNB | 기니비사우 | O | O | O | O | O | O | O | O | PASS |  |
| GNQ | 적도 기니 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| GRC | 그리스 | O | O | O | O | O | O | O | O | PASS |  |
| GRD | 그레나다 | O | O | O | O | O | O | O | O | PASS |  |
| GTM | 과테말라 | O | O | O | O | O | O | O | O | PASS |  |
| GUY | 가이아나 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| HND | 온두라스 | O | O | O | O | O | O | O | O | PASS |  |
| HRV | 크로아티아 | O | O | O | O | O | O | O | O | PASS |  |
| HTI | 아이티 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| HUN | 헝가리 | O | O | O | O | O | O | O | O | PASS |  |
| IDN | 인도네시아 | O | O | O | O | O | O | O | O | PASS |  |
| IND | 인도 | O | O | O | O | O | O | - | O | PASS |  |
| IRL | 아일랜드 | O | O | O | O | O | O | O | O | PASS |  |
| IRN | 이란 | O | O | O | O | O | O | O | O | PASS |  |
| IRQ | 이라크 | O | O | O | O | O | O | O | O | PASS |  |
| ISL | 아이슬란드 | O | O | O | O | O | O | O | O | PASS |  |
| ISR | 이스라엘 | O | O | O | O | O | O | O | O | PASS |  |
| ITA | 이탈리아 | O | O | O | O | O | O | O | O | PASS |  |
| JAM | 자메이카 | O | O | O | O | O | O | O | O | PASS |  |
| JOR | 요르단 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| JPN | 일본 | O | O | O | O | O | O | O | O | PASS |  |
| KAZ | 카자흐스탄 | O | O | O | O | O | O | O | O | PASS |  |
| KEN | 케냐 | O | O | O | O | O | O | O | O | PASS |  |
| KGZ | 키르기스스탄 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| KHM | 캄보디아 | O | O | O | O | O | O | O | O | PASS |  |
| KIR | 키리바시 | O | O | O | O | O | O | O | O | PASS |  |
| KNA | 세인트키츠 네비스 | O | O | O | O | O | O | O | O | PASS |  |
| KOR | 대한민국 | O | O | O | O | O | O | O | O | PASS |  |
| KWT | 쿠웨이트 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| LAO | 라오스 | O | O | O | O | O | O | O | O | PASS |  |
| LBN | 레바논 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| LBR | 라이베리아 | O | O | O | O | O | O | O | O | PASS |  |
| LBY | 리비아 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| LCA | 세인트루시아 | O | O | O | O | O | O | O | O | PASS |  |
| LIE | 리히텐슈타인 | O | O | O | O | O | O | O | O | PASS |  |
| LKA | 스리랑카 | O | O | O | O | O | O | O | O | PASS |  |
| LSO | 레소토 | O | O | O | O | O | O | O | O | PASS |  |
| LTU | 리투아니아 | O | O | O | O | O | O | O | O | PASS |  |
| LUX | 룩셈부르크 | O | O | O | O | O | O | O | O | PASS |  |
| LVA | 라트비아 | O | O | O | O | O | O | O | O | PASS |  |
| MAR | 모로코 | O | O | O | O | O | O | O | O | PASS |  |
| MCO | 모나코 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| MDA | 몰도바 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| MDG | 마다가스카르 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| MDV | 몰디브 | O | O | O | O | O | O | O | O | PASS |  |
| MEX | 멕시코 | O | O | O | O | O | O | O | O | PASS |  |
| MHL | 마셜 제도 | O | O | O | O | O | O | O | O | PASS |  |
| MKD | 북마케도니아 | O | O | O | O | O | O | O | O | PASS |  |
| MLI | 말리 | O | O | O | O | O | O | O | O | PASS |  |
| MLT | 몰타 | O | O | O | O | O | O | O | O | PASS |  |
| MMR | 미얀마 | O | O | O | O | O | O | O | O | PASS |  |
| MNE | 몬테네그로 | O | O | O | O | O | O | O | O | PASS |  |
| MNG | 몽골 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| MOZ | 모잠비크 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| MRT | 모리타니 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| MUS | 모리셔스 | O | O | O | O | O | O | O | O | PASS |  |
| MWI | 말라위 | O | O | O | O | O | O | O | O | PASS |  |
| MYS | 말레이시아 | O | O | O | O | O | O | O | O | PASS |  |
| NAM | 나미비아 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용, languages[].ko 영문 허용, languages[].ko 영문 허용, languages[].ko 영문 허용 |
| NER | 니제르 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| NGA | 나이지리아 | O | O | O | O | O | O | O | O | PASS |  |
| NIC | 니카라과 | O | O | O | O | O | O | O | O | PASS |  |
| NLD | 네덜란드 | O | O | O | O | O | O | O | O | PASS |  |
| NOR | 노르웨이 | O | O | O | O | O | O | O | O | PASS |  |
| NPL | 네팔 | O | O | O | O | O | O | O | O | PASS |  |
| NRU | 나우루 | O | O | O | O | O | O | O | O | PASS |  |
| NZL | 뉴질랜드 | O | O | O | O | O | O | O | O | PASS |  |
| OMN | 오만 | O | O | O | O | O | O | O | O | PASS |  |
| PAK | 파키스탄 | O | O | O | O | O | O | O | O | PASS |  |
| PAN | 파나마 | O | O | O | O | O | O | O | O | PASS |  |
| PER | 페루 | O | O | O | O | O | O | - | O | PASS |  |
| PHL | 필리핀 | O | O | O | O | O | O | O | O | PASS |  |
| PLW | 팔라우 | O | O | O | O | O | O | O | O | PASS |  |
| PNG | 파푸아뉴기니 | O | O | O | O | O | O | O | O | PASS |  |
| POL | 폴란드 | O | O | O | O | O | O | O | O | PASS |  |
| PRK | 조선민주주의인민공화국 | O | O | O | O | O | O | O | O | PASS |  |
| PRT | 포르투갈 | O | O | O | O | O | O | O | O | PASS |  |
| PRY | 파라과이 | O | O | O | O | O | O | O | O | PASS |  |
| PSE | 팔레스타인 | O | O | O | O | O | O | O | O | PASS |  |
| QAT | 카타르 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| ROU | 루마니아 | O | O | O | O | O | O | O | O | PASS |  |
| RUS | 러시아 | O | O | O | O | O | O | O | O | REVIEW | religion.ko 영문 허용 |
| RWA | 르완다 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| SAU | 사우디아라비아 | O | O | O | O | O | O | O | O | PASS |  |
| SDN | 수단 | O | O | O | O | O | O | O | O | PASS |  |
| SEN | 세네갈 | O | O | O | O | O | O | O | O | PASS |  |
| SGP | 싱가포르 | O | O | O | O | O | O | O | O | PASS |  |
| SLB | 솔로몬 제도 | O | O | O | O | O | O | O | O | PASS |  |
| SLE | 시에라리온 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| SLV | 엘살바도르 | O | O | O | O | O | O | O | O | PASS |  |
| SMR | 산마리노 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| SOM | 소말리아 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| SRB | 세르비아 | O | O | O | O | O | O | O | O | PASS |  |
| SSD | 남수단 | O | O | O | O | O | O | O | O | PASS |  |
| STP | 상투메 프린시페 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| SUR | 수리남 | O | O | O | O | O | O | O | O | PASS |  |
| SVK | 슬로바키아 | O | O | O | O | O | O | O | O | PASS |  |
| SVN | 슬로베니아 | O | O | O | O | O | O | O | O | PASS |  |
| SWE | 스웨덴 | O | O | O | O | O | O | O | O | PASS |  |
| SWZ | 에스와티니 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| SYC | 세이셸 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| SYR | 시리아 | O | O | O | O | O | O | O | O | PASS |  |
| TCD | 차드 | O | O | O | O | O | O | O | O | PASS |  |
| TGO | 토고 | O | O | O | O | O | O | O | O | PASS |  |
| THA | 태국 | O | O | O | O | O | O | O | O | PASS |  |
| TJK | 타지키스탄 | O | O | O | O | O | O | O | O | PASS |  |
| TKM | 투르크메니스탄 | O | O | O | O | O | O | O | O | PASS |  |
| TLS | 동티모르 | O | O | O | O | O | O | O | O | PASS |  |
| TON | 통가 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| TTO | 트리니다드 토바고 | O | O | O | O | O | O | O | O | PASS |  |
| TUN | 튀니지 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| TUR | 터키 | O | O | O | O | O | O | O | O | PASS |  |
| TUV | 투발루 | O | O | O | O | O | O | O | O | PASS |  |
| TZA | 탄자니아 | O | O | O | O | O | O | O | O | PASS |  |
| UGA | 우간다 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| UKR | 우크라이나 | O | O | O | O | O | O | O | O | PASS |  |
| URY | 우루과이 | O | O | O | O | O | O | O | O | PASS |  |
| USA | 미국 | O | O | O | O | O | O | O | O | PASS |  |
| UZB | 우즈베키스탄 | O | O | O | O | O | O | O | O | PASS |  |
| VAT | 바티칸 | O | O | O | O | O | O | O | - | REVIEW | leader.ko 영문 허용 |
| VCT | 세인트빈센트 그레나딘 | O | O | O | O | O | O | O | O | PASS |  |
| VEN | 베네수엘라 | O | O | O | O | O | O | O | O | PASS |  |
| VNM | 베트남 | O | O | O | O | O | O | O | O | PASS |  |
| VUT | 바누아투 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| WSM | 사모아 | O | O | O | O | O | O | O | O | PASS |  |
| YEM | 예멘 | O | O | O | O | O | O | O | O | REVIEW | leader.ko 영문 허용 |
| ZAF | 남아프리카 | O | O | O | O | O | O | O | O | PASS |  |
| ZMB | 잠비아 | O | O | O | O | O | O | O | O | PASS |  |
| ZWE | 짐바브웨 | O | O | O | O | O | O | O | O | REVIEW | languages[].ko 영문 허용, languages[].ko 영문 허용, languages[].ko 영문 허용 |
