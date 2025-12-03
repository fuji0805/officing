#!/bin/bash

# Validation script for demo HTML files
# This script checks if all demo files exist and are accessible

echo "🧪 Validating Demo HTML Files"
echo "=============================="
echo ""

DEMO_FILES=(
    "auth-demo.html"
    "checkin-test.html"
    "checkin-success-demo.html"
    "dashboard-demo.html"
    "lottery-demo.html"
    "quest-demo.html"
    "shop-demo.html"
    "stamp-demo.html"
    "titles-demo.html"
    "error-handling-demo.html"
    "pwa-test.html"
    "routing-test.html"
    "qr-generator-test.html"
    "ui-test.html"
)

PASSED=0
FAILED=0
WARNINGS=0

for file in "${DEMO_FILES[@]}"; do
    if [ -f "$file" ]; then
        # Check if file is not empty
        if [ -s "$file" ]; then
            echo "✅ $file - OK"
            ((PASSED++))
        else
            echo "⚠️  $file - EMPTY"
            ((WARNINGS++))
        fi
    else
        echo "❌ $file - NOT FOUND"
        ((FAILED++))
    fi
done

echo ""
echo "=============================="
echo "Summary:"
echo "  ✅ Passed: $PASSED"
echo "  ⚠️  Warnings: $WARNINGS"
echo "  ❌ Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "🎉 All demo files are valid!"
    exit 0
elif [ $FAILED -eq 0 ]; then
    echo "⚠️  Some files are empty but all exist"
    exit 0
else
    echo "❌ Some demo files are missing"
    exit 1
fi
