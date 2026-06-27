import { describe, it, expect } from 'vitest'
import { renderTemplate, extractVariables } from '../../lib/handlebars'

describe('renderTemplate', () => {
  it('interpolates a single variable', () => {
    expect(renderTemplate('Hello {{name}}', { name: 'Ana' })).toBe('Hello Ana')
  })

  it('interpolates multiple variables', () => {
    const result = renderTemplate('Hi {{name}}, welcome to {{company}}!', {
      name: 'Luis',
      company: 'Acme',
    })
    expect(result).toBe('Hi Luis, welcome to Acme!')
  })

  it('leaves missing variables as empty string', () => {
    const result = renderTemplate('Hello {{name}}', {})
    expect(result).toBe('Hello ')
  })

  it('handles nested object properties', () => {
    const result = renderTemplate('{{user.email}}', { user: { email: 'a@b.com' } })
    expect(result).toBe('a@b.com')
  })

  it('renders HTML content correctly', () => {
    const result = renderTemplate('<h1>Hola {{name}}</h1>', { name: 'María' })
    expect(result).toBe('<h1>Hola María</h1>')
  })

  it('returns template unchanged when no variables', () => {
    const tpl = '<p>Static content</p>'
    expect(renderTemplate(tpl, {})).toBe(tpl)
  })
})

describe('extractVariables', () => {
  it('extracts a single variable', () => {
    expect(extractVariables('Hello {{name}}')).toEqual(['name'])
  })

  it('extracts multiple unique variables', () => {
    const vars = extractVariables('{{name}} from {{company}} — {{name}}')
    expect(vars).toEqual(['name', 'company'])
  })

  it('returns empty array for no variables', () => {
    expect(extractVariables('<p>No vars here</p>')).toEqual([])
  })

  it('trims whitespace from variable names', () => {
    expect(extractVariables('{{ name }}')).toEqual(['name'])
  })

  it('ignores block helpers like {{#if}} and {{/if}}', () => {
    const vars = extractVariables('{{#if active}}{{name}}{{/if}}')
    expect(vars).toEqual(['name'])
  })

  it('handles complex HTML with multiple variables', () => {
    const html = '<h1>Hola {{name}},</h1><p>Tu empresa: {{company}}. Email: {{email}}</p>'
    const vars = extractVariables(html)
    expect(vars).toContain('name')
    expect(vars).toContain('company')
    expect(vars).toContain('email')
    expect(vars).toHaveLength(3)
  })
})
