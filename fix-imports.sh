# fix-imports.sh

#!/bin/bash
set -e

echo "Fixing imports after lib reorganization..."

# 1. Ensure index.ts files exist in each folder
cat > src/lib/db/index.ts << 'EOF'
export { default as connectToDatabase } from "./mongodb";
EOF

cat > src/lib/auth/index.ts << 'EOF'
export * from "./auth";
export * from "./auth-options";
EOF

cat > src/lib/api/index.ts << 'EOF'
export { withDb } from "./api-handler";
export { getClientIp } from "./request";
EOF

cat > src/lib/errors/index.ts << 'EOF'
export * from "./errors";
EOF

# 2. Update import paths in all .ts and .tsx files
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from "@/lib/mongodb"|from "@/lib/db"|g' {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from "@/lib/auth-options"|from "@/lib/auth"|g' {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from "@/lib/api-handler"|from "@/lib/api"|g' {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from "@/lib/request"|from "@/lib/api"|g' {} +

# 3. Verify no old imports remain
echo "Checking for old import paths..."
OLD_IMPORTS=$(grep -r "from \"@/lib/mongodb\"" src/ || true)
if [ -n "$OLD_IMPORTS" ]; then
  echo "WARNING: Some imports still use old path @/lib/mongodb:"
  echo "$OLD_IMPORTS"
else
  echo "✅ @/lib/mongodb: OK"
fi

OLD_IMPORTS=$(grep -r "from \"@/lib/auth-options\"" src/ || true)
if [ -n "$OLD_IMPORTS" ]; then
  echo "WARNING: Some imports still use old path @/lib/auth-options:"
  echo "$OLD_IMPORTS"
else
  echo "✅ @/lib/auth-options: OK"
fi

OLD_IMPORTS=$(grep -r "from \"@/lib/api-handler\"" src/ || true)
if [ -n "$OLD_IMPORTS" ]; then
  echo "WARNING: Some imports still use old path @/lib/api-handler:"
  echo "$OLD_IMPORTS"
else
  echo "✅ @/lib/api-handler: OK"
fi

OLD_IMPORTS=$(grep -r "from \"@/lib/request\"" src/ || true)
if [ -n "$OLD_IMPORTS" ]; then
  echo "WARNING: Some imports still use old path @/lib/request:"
  echo "$OLD_IMPORTS"
else
  echo "✅ @/lib/request: OK"
fi

echo "All import fixes applied."