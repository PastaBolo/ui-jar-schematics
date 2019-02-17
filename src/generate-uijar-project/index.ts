import {
  Rule,
  SchematicContext,
  Tree,
  externalSchematic,
  mergeWith,
  apply,
  url,
  move,
  chain,
  noop,
  MergeStrategy
} from '@angular-devkit/schematics'
import {
  addPackageJsonDependency,
  NodeDependency,
  NodeDependencyType
} from '@schematics/angular/utility/dependencies'
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks'
import { Schema as ApplicationOptions } from '@schematics/angular/application/schema'

import { getDependencyVersion } from '../utility/dependencies'

import { Schema as GenerateUiJarProjectOptions } from './schema'

export default function(options: GenerateUiJarProjectOptions): Rule {
  return chain([
    (_tree: Tree, context: SchematicContext) => {
      !options.skipInstall ? context.addTask(new NodePackageInstallTask()) : noop()
    },
    addUIJarDependency(),
    externalSchematic<ApplicationOptions>('@schematics/angular', 'application', {
      name: 'ui-jar',
      skipInstall: true,
      minimal: true
    }),
    setupUIJarProject()
  ])
}

function addUIJarDependency(): Rule {
  const uijarDependency: NodeDependency = {
    name: 'ui-jar',
    version: '*',
    type: NodeDependencyType.Dev
  }

  return chain([
    getDependencyVersion(uijarDependency),
    (tree: Tree, _context: SchematicContext) => {
      addPackageJsonDependency(tree, uijarDependency)
    }
  ])
}

function setupUIJarProject(): Rule {
  return chain([addScriptsToPackageJson(), updateTsConfig(), replaceFiles()])
}

function addScriptsToPackageJson(): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const json = JSON.parse(tree.read('./package.json')!.toString('utf-8'))

    json.scripts['start:ui-jar'] =
      'node node_modules/ui-jar/dist/bin/cli.js --directory ./src/app/ --includes \\.ts$ && ng serve ui-jar -o'

    tree.overwrite('./package.json', JSON.stringify(json, null, 2))
  }
}

function updateTsConfig(): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const json = JSON.parse(tree.read('./projects/ui-jar/tsconfig.app.json')!.toString('utf-8'))

    json.exclude
      ? json.exclude.push('../../src/**/*.spec.ts')
      : (json.exclude = ['../../src/**/*.spec.ts'])

    json.include
      ? json.include.push(['**/*.ts', '../../src/**/*.ts'])
      : (json.include = ['**/*.ts', '../../src/**/*.ts'])

    tree.overwrite('./projects/ui-jar/tsconfig.app.json', JSON.stringify(json, null, 2))
  }
}

function replaceFiles(): Rule {
  return mergeWith(apply(url('./files'), [move('./projects/ui-jar/src')]), MergeStrategy.Overwrite)
}
