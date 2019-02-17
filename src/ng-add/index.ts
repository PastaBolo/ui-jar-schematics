import { Rule, chain, schematic } from '@angular-devkit/schematics'

import { Schema as GenerateUiJarProjectOptions } from '../generate-uijar-project/schema'
import { movePackageToDevDependencies } from '../utility/dependencies'
import { packageName } from '../utility/utils'

export default function(_options: any): Rule {
  return chain([
    schematic<GenerateUiJarProjectOptions>('generate-uijar-project', {}),
    movePackageToDevDependencies(packageName('../../package.json'))
  ])
}
