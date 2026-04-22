import Handlebars from 'handlebars'

export function renderTemplate(
  htmlBody: string,
  context: Record<string, unknown>
): string {
  const compiled = Handlebars.compile(htmlBody)
  return compiled(context)
}

export function extractVariables(htmlBody: string): string[] {
  const regex = /\{\{([^#/}]+)\}\}/g
  const vars = new Set<string>()
  let match: RegExpExecArray | null
  while ((match = regex.exec(htmlBody)) !== null) {
    vars.add(match[1].trim())
  }
  return Array.from(vars)
}
