const fs = require('fs');
const path = 'src/app/menu/[slug]/page.tsx';

let content = fs.readFileSync(path, 'utf8');

// Fix specific template literals causing issues
// 1. Variant Price Display: `+ ${ variant.price } ${ restaurant.currency } `
content = content.replace(/`\+ \${ variant.price } \${ restaurant.currency } `/g, "'+ ' + variant.price + ' ' + restaurant.currency");

// 2. Variants List: ` (+\${ item.selectedVariants.map(v => v.name).join(', ') })` (escaped for regex)
// Regex: /` \(\+\${ item.selectedVariants.map\(v => v.name\).join\(', '\) }\)`/g
// This is getting hard to match exactly due to spaces.
// Let's match simpler sub-patterns.

// Replace `+ ${ variant.price } ${ restaurant.currency } `
// Using a function to be safer against variations in spacing
content = content.replace(/`\+ \${(.*?)} \${(.*?)} `/g, "'+ ' + $1 + ' ' + $2");

// Replace ` (+\${...})` pattern in Whatsapp message or UI
// message += ' (+' + item.selectedVariants...
// But wait, the error was at line 1029 which is UI display.

// Let's replace ANY sequence of `${...}` inside backticks with concatenation if it's short?
// No, let's just do global replace of `${` with `' + ` and `}` with ` + '` IF they are likely in these small strings.

// Specific fixes for UI components variants
content = content.replace(/`\+ \${(.*?)}`/g, "'+ ' + $1");
content = content.replace(/` \${(.*?)}`/g, "' ' + $1");

// Fix `3px solid ...` again if I missed any
content = content.replace(/`3px solid \${(.*?)} ?`/g, "'3px solid ' + $1");

// Fix ` (ÇIKAR: ${...})`
content = content.replace(/` \(ÇIKAR: \${(.*?)}\)`/g, "' (ÇIKAR: ' + $1 + ')'");

// Fix `TOPLAM TUTAR: ${...}`
content = content.replace(/`TOPLAM TUTAR: \${(.*?)}`/g, "'TOPLAM TUTAR: ' + $1");

// Fix `${item.quantity}x` in table
content = content.replace(/`\${item.quantity}x`/g, "item.quantity + 'x'");

// Fix `${item.name}` in table
content = content.replace(/`\${item.name}`/g, "item.name");

// Fix `${item.finalPrice * item.quantity} ₺`
content = content.replace(/`\${item.finalPrice \* item.quantity} ₺`/g, "(item.finalPrice * item.quantity) + ' ₺'");

fs.writeFileSync(path, content);
console.log('Patched more template literals.');
