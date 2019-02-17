import { Rule, SchematicContext, SchematicsException } from '@angular-devkit/schematics'
import { Tree } from '@angular-devkit/schematics/src/tree/interface'
import {
  getPackageJsonDependency,
  addPackageJsonDependency,
  NodeDependency,
  NodeDependencyType
} from '@schematics/angular/utility/dependencies'

import * as https from 'https'
import { Observable, of, forkJoin } from 'rxjs'
import { mergeMap, switchMap } from 'rxjs/operators'

import { getJson } from './json-utils'

function fetchDependencyVersion(dependency: NodeDependency) {
  return new Observable<NodeDependency>(observer => {
    https.get(`https://registry.npmjs.org/${dependency.name}`, res => {
      if (res.statusCode !== 200) {
        const error = `Request failed for ${dependency.name} package.\nStatus code : ${
          res.statusCode
        }`
        res.resume()
        observer.complete()
        throw new SchematicsException(error)
      }

      let rawData = ''
      res.on('data', chunk => {
        rawData += chunk
      })
      res.on('end', () => {
        dependency.version = JSON.parse(rawData)['dist-tags'].latest
        observer.next(dependency)
        observer.complete()
      })
    })
  })
}

export function getDependencyVersion(dependency: NodeDependency): Rule {
  return (tree: Tree, _context: SchematicContext): Observable<Tree> =>
    fetchDependencyVersion(dependency).pipe(switchMap(() => of(tree)))
}

export function getDependenciesVersion(dependencies: NodeDependency[]): Rule {
  return (tree: Tree, _context: SchematicContext): Observable<Tree> =>
    of(dependencies).pipe(
      mergeMap(dependencies => forkJoin(...dependencies.map(fetchDependencyVersion))),
      switchMap(() => of(tree))
    )
}

export function addPackageJsonDependencies(dependencies: NodeDependency[]): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    dependencies.forEach(dependency => addPackageJsonDependency(tree, dependency))
  }
}

export function movePackageToDevDependencies(name: string): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const packageDependency = getPackageJsonDependency(tree, name)
    if (packageDependency) {
      addPackageJsonDependency(tree, { ...packageDependency, type: NodeDependencyType.Dev })
      removePackageJsonDependency(tree, packageDependency.name)
    }
  }
}

function removePackageJsonDependency(
  tree: Tree,
  name: string,
  type: NodeDependencyType = NodeDependencyType.Default
) {
  const packageJson = getJson(tree)
  delete packageJson[type][name]
  tree.overwrite('./package.json', JSON.stringify(packageJson, null, 2))
}
