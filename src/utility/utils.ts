export function packageName(packageJsonPath: string): string {
  return require(packageJsonPath).name
}
