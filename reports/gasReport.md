# Gas Report

---

| src/modules/NFT/borrowerNFT.sol:Borrower contract |                 |        |        |        |         |
|---------------------------------------------------|-----------------|--------|--------|--------|---------|
| Deployment Cost                                   | Deployment Size |        |        |        |         |
| 0                                                 | 0               |        |        |        |         |
| Function Name                                     | min             | avg    | median | max    | # calls |
| deposit                                           | 64325           | 94387  | 81998  | 134045 | 9       |
| getData                                           | 9404            | 9404   | 9404   | 9404   | 34      |
| withdraw                                          | 143078          | 173737 | 178410 | 179539 | 9       |
| src/modules/NFT/borrowerNFT.sol:BorrowerNFTManager contract |                 |      |        |      |         |
|-------------------------------------------------------------|-----------------|------|--------|------|---------|
| Deployment Cost                                             | Deployment Size |      |        |      |         |
| 0                                                           | 0               |      |        |      |         |
| Function Name                                               | min             | avg  | median | max  | # calls |
| getContractAddress                                          | 258             | 258  | 258    | 258  | 66      |
| getOwner                                                    | 768             | 1038 | 768    | 2768 | 133     |
| ownerOf                                                     | 686             | 1609 | 686    | 2686 | 13      |
| src/modules/NFT/lenderNFT.sol:Lender contract |                 |       |        |        |         |
|-----------------------------------------------|-----------------|-------|--------|--------|---------|
| Deployment Cost                               | Deployment Size |       |        |        |         |
| 0                                             | 0               |       |        |        |         |
| Function Name                                 | min             | avg   | median | max    | # calls |
| getOwed                                       | 8586            | 17816 | 8586   | 28586  | 13      |
| withdraw                                      | 90346           | 95431 | 95233  | 100913 | 4       |
| src/modules/NFT/lenderNFT.sol:LenderNFTManager contract |                 |      |        |      |         |
|---------------------------------------------------------|-----------------|------|--------|------|---------|
| Deployment Cost                                         | Deployment Size |      |        |      |         |
| 0                                                       | 0               |      |        |      |         |
| Function Name                                           | min             | avg  | median | max  | # calls |
| getContractAddress                                      | 258             | 258  | 258    | 258  | 12      |
| getOwner                                                | 2790            | 2790 | 2790   | 2790 | 4       |
| src/modules/automationManager.sol:AutomationManager contract |                 |        |        |        |         |
|--------------------------------------------------------------|-----------------|--------|--------|--------|---------|
| Deployment Cost                                              | Deployment Size |        |        |        |         |
| 612742                                                       | 2859            |        |        |        |         |
| Function Name                                                | min             | avg    | median | max    | # calls |
| checkUpkeep                                                  | 7660            | 7660   | 7660   | 7660   | 13      |
| performUpkeep                                                | 205448          | 261204 | 221939 | 370390 | 6       |
| src/modules/bondContractsManager.sol:BondContractsManager contract |                 |        |        |        |         |
|--------------------------------------------------------------------|-----------------|--------|--------|--------|---------|
| Deployment Cost                                                    | Deployment Size |        |        |        |         |
| 6131150                                                            | 29419           |        |        |        |         |
| Function Name                                                      | min             | avg    | median | max    | # calls |
| getBondAddresses                                                   | 2129            | 2129   | 2129   | 2129   | 5       |
| getBondData                                                        | 2726            | 6823   | 2726   | 20726  | 123     |
| getBondPairs                                                       | 1103            | 2026   | 1103   | 5103   | 26      |
| getNFTAddresses                                                    | 680             | 680    | 680    | 680    | 10      |
| lendToBorrower                                                     | 574208          | 610821 | 628906 | 629351 | 3       |
| src/modules/requestManager.sol:RequestManager contract |                 |       |        |       |         |
|--------------------------------------------------------|-----------------|-------|--------|-------|---------|
| Deployment Cost                                        | Deployment Size |       |        |       |         |
| 1531159                                                | 6873            |       |        |       |         |
| Function Name                                          | min             | avg   | median | max   | # calls |
| getBondRequests                                        | 1729            | 1729  | 1729   | 1729  | 37      |
| getRequiredAmountForRequest                            | 7379            | 21810 | 14812  | 62309 | 74      |
| getWhitelistedTokens                                   | 2441            | 2441  | 2441   | 2441  | 15      |
| indexOfBondRequest                                     | 2982            | 3792  | 2982   | 12982 | 37      |
| src/utils/externalUtils.sol:ExternalUtils contract |                 |       |        |       |         |
|----------------------------------------------------|-----------------|-------|--------|-------|---------|
| Deployment Cost                                    | Deployment Size |       |        |       |         |
| 0                                                  | 0               |       |        |       |         |
| Function Name                                      | min             | avg   | median | max   | # calls |
| canTrade                                           | 7232            | 11527 | 11732  | 14262 | 33      |
