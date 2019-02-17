import { Tree } from '@angular-devkit/schematics/src/tree/interface'
import { SchematicsException } from '@angular-devkit/schematics'

export function getJson(tree: Tree) {
  const buffer = tree.read('./package.json')
  if (buffer === null) {
    throw new SchematicsException('Could not read package.json.')
  }
  return JSON.parse(buffer.toString('utf-8'))
}
