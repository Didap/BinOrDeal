import fs from 'fs'
import path from 'path'

const filePath = 'c:/Users/aless/Documents/GitHub/BinOrDeal/src/lib/mock/catalog.ts'
let content = fs.readFileSync(filePath, 'utf8')

// Update vertical: "pokemon" to vertical: "tcg"
content = content.replace(/vertical: "pokemon"/g, 'vertical: "tcg"')

// Update meta: { set: to meta: { game: "pokemon", set:
// Only if game: "pokemon" is not already there
content = content.replace(/meta: { (?!game: "pokemon")/g, 'meta: { game: "pokemon", ')

fs.writeFileSync(filePath, content)
console.log('Migration complete')
