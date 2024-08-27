#!/bin/bash

# Initialize the coverage report
echo "# Coverage Report" > reports/coverageReport.md
echo "" >> reports/coverageReport.md
echo "---" >> reports/coverageReport.md
echo "" >> reports/coverageReport.md

# Run the coverage command and capture the output
forge coverage -f https://arb1.arbitrum.io/rpc | tee >(grep -vE "dependencies/|Total" | grep -E "^(\|.*)" >> reports/coverageReport.md) | grep -vE "dependencies/|Total"
