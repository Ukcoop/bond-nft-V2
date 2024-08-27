# Gas Report

---

| src/modules/NFT/borrowerNFT.sol:Borrower contract |                 |        |        |        |         |
|---------------------------------------------------|-----------------|--------|--------|--------|---------|
| Deployment Cost                                   | Deployment Size |        |        |        |         |
| 0                                                 | 0               |        |        |        |         |
| Function Name                                     | min             | avg    | median | max    | # calls |
| deposit                                           | 81939           | 116633 | 133974 | 133986 | 3       |
| getData                                           | 9426            | 9426   | 9426   | 9426   | 11      |
| withdraw                                          | 168623          | 175111 | 178349 | 178361 | 3       |
| src/modules/NFT/borrowerNFT.sol:BorrowerNFTManager contract |                 |      |        |      |         |
|-------------------------------------------------------------|-----------------|------|--------|------|---------|
| Deployment Cost                                             | Deployment Size |      |        |      |         |
| 0                                                           | 0               |      |        |      |         |
| Function Name                                               | min             | avg  | median | max  | # calls |
| getContractAddress                                          | 258             | 258  | 258    | 258  | 27      |
| getOwner                                                    | 768             | 1040 | 768    | 2768 | 44      |
| ownerOf                                                     | 686             | 1436 | 686    | 2686 | 8       |
| src/modules/NFT/lenderNFT.sol:Lender contract |                 |        |        |        |         |
|-----------------------------------------------|-----------------|--------|--------|--------|---------|
| Deployment Cost                               | Deployment Size |        |        |        |         |
| 0                                             | 0               |        |        |        |         |
| Function Name                                 | min             | avg    | median | max    | # calls |
| getOwed                                       | 8608            | 16108  | 8608   | 28608  | 8       |
| withdraw                                      | 100142          | 100406 | 100142 | 100935 | 3       |
| src/modules/NFT/lenderNFT.sol:LenderNFTManager contract |                 |      |        |      |         |
|---------------------------------------------------------|-----------------|------|--------|------|---------|
| Deployment Cost                                         | Deployment Size |      |        |      |         |
| 0                                                       | 0               |      |        |      |         |
| Function Name                                           | min             | avg  | median | max  | # calls |
| getContractAddress                                      | 376             | 728  | 376    | 2376 | 17      |
| getOwner                                                | 2790            | 2790 | 2790   | 2790 | 3       |
| src/modules/automationManager.sol:AutomationManager contract |                 |        |        |        |         |
|--------------------------------------------------------------|-----------------|--------|--------|--------|---------|
| Deployment Cost                                              | Deployment Size |        |        |        |         |
| 612742                                                       | 2859            |        |        |        |         |
| Function Name                                                | min             | avg    | median | max    | # calls |
| checkUpkeep                                                  | 7694            | 7694   | 7694   | 7694   | 8       |
| performUpkeep                                                | 225407          | 275298 | 240588 | 359900 | 3       |
| src/modules/bank.sol:BondRequestBank contract |                 |      |        |      |         |
|-----------------------------------------------|-----------------|------|--------|------|---------|
| Deployment Cost                               | Deployment Size |      |        |      |         |
| 689275                                        | 3215            |      |        |      |         |
| Function Name                                 | min             | avg  | median | max  | # calls |
| spenderCanSpendAmount                         | 1959            | 3394 | 1959   | 9959 | 39      |
| src/modules/bondContractsManager.sol:BondContractsManager contract |                 |        |        |        |         |
|--------------------------------------------------------------------|-----------------|--------|--------|--------|---------|
| Deployment Cost                                                    | Deployment Size |        |        |        |         |
| 6515560                                                            | 31138           |        |        |        |         |
| Function Name                                                      | min             | avg    | median | max    | # calls |
| getBondAddresses                                                   | 2269            | 2269   | 2269   | 2269   | 4       |
| getBondData                                                        | 2726            | 7134   | 2726   | 20726  | 49      |
| getBondPairs                                                       | 1125            | 1875   | 1125   | 5125   | 16      |
| getNFTAddresses                                                    | 680             | 680    | 680    | 680    | 9       |
| lendToBorrower                                                     | 688525          | 688525 | 688525 | 688525 | 1       |
| src/modules/requestManager.sol:RequestManager contract |                 |       |        |        |         |
|--------------------------------------------------------|-----------------|-------|--------|--------|---------|
| Deployment Cost                                        | Deployment Size |       |        |        |         |
| 1803752                                                | 8168            |       |        |        |         |
| Function Name                                          | min             | avg   | median | max    | # calls |
| getBondRequests                                        | 1818            | 1818  | 1818   | 1818   | 12      |
| getRequiredAmountForRequest                            | 5414            | 20552 | 14176  | 64604  | 24      |
| getWhitelistedTokens                                   | 2419            | 2419  | 2419   | 2419   | 15      |
| indexOfBondRequest                                     | 2971            | 3804  | 2971   | 12971  | 12      |
| postBondRequest                                        | 23124           | 45303 | 41250  | 173929 | 188     |
| src/utils/externalUtils.sol:ExternalUtils contract |                 |       |        |       |         |
|----------------------------------------------------|-----------------|-------|--------|-------|---------|
| Deployment Cost                                    | Deployment Size |       |        |       |         |
| 0                                                  | 0               |       |        |       |         |
| Function Name                                      | min             | avg   | median | max   | # calls |
| canTrade                                           | 7232            | 10825 | 11732  | 14262 | 12      |
