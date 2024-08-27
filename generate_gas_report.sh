#!/bin/bash

# Initialize the coverage report
echo "# Gas Report" > reports/gasReport.md
echo "" >> reports/gasReport.md
echo "---" >> reports/gasReport.md
echo "" >> reports/gasReport.md

# Run the coverage command and capture the output
forge test -f https://arb1.arbitrum.io/rpc --gas-report | tee >(grep -E "^(\|.*)" >> reports/gasReport.md)
