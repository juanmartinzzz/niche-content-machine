'use client'

import React from 'react'
import { Input, Textarea } from '@/components/interaction'

interface SchemaFormProps {
  schema: string
  value: Record<string, any>
  onChange: (value: Record<string, any>) => void
}

export function SchemaForm({ schema, value, onChange }: SchemaFormProps) {
  try {
    const parsedSchema = JSON.parse(schema)
    return <SchemaObjectForm schema={parsedSchema} value={value} onChange={onChange} />
  } catch (error) {
    return (
      <div style={{ color: 'var(--color-error, #ef4444)', fontSize: '14px' }}>
        Invalid JSON schema: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    )
  }
}

interface SchemaObjectFormProps {
  schema: any
  value: Record<string, any>
  onChange: (value: Record<string, any>) => void
  path?: string[]
}

function SchemaObjectForm({ schema, value, onChange, path = [] }: SchemaObjectFormProps) {
  if (!schema || typeof schema !== 'object') {
    return null
  }

  const properties = schema.properties || {}
  const required = schema.required || []

  const handleFieldChange = (fieldName: string, fieldValue: any) => {
    const newValue = { ...value, [fieldName]: fieldValue }
    onChange(newValue)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {Object.entries(properties).map(([fieldName, fieldSchema]: [string, any]) => {
        const fieldPath = [...path, fieldName]
        const fieldValue = value[fieldName]
        const isRequired = required.includes(fieldName)

        return (
          <div key={fieldName}>
            <SchemaField
              name={fieldName}
              schema={fieldSchema}
              value={fieldValue}
              onChange={(newValue) => handleFieldChange(fieldName, newValue)}
              required={isRequired}
              path={fieldPath}
            />
          </div>
        )
      })}
    </div>
  )
}

interface SchemaFieldProps {
  name: string
  schema: any
  value: any
  onChange: (value: any) => void
  required?: boolean
  path: string[]
}

function SchemaField({ name, schema, value, onChange, required, path }: SchemaFieldProps) {
  if (!schema || typeof schema !== 'object') {
    return null
  }

  const title = schema.title || name
  const description = schema.description
  const fieldType = schema.type
  const format = schema.format
  const placeholder = schema.placeholder || schema.default

  // Handle different field types
  switch (fieldType) {
    case 'string':
      if (format === 'textarea' || schema.maxLength > 100) {
        return (
          <Textarea
            label={`${title}${required ? ' *' : ''}`}
            value={value || ''}
            onChange={(val) => onChange(val)}
            placeholder={placeholder}
            required={required}
            rows={4}
          />
        )
      }
      return (
        <Input
          label={`${title}${required ? ' *' : ''}`}
          type={format === 'email' ? 'email' : format === 'password' ? 'password' : 'text'}
          value={value || ''}
          onChange={(val) => onChange(val)}
          placeholder={placeholder}
          required={required}
        />
      )

    case 'number':
    case 'integer':
      return (
        <Input
          label={`${title}${required ? ' *' : ''}`}
          type="number"
          value={value?.toString() || ''}
          onChange={(val) => onChange(val === '' ? undefined : Number(val))}
          placeholder={placeholder}
          required={required}
        />
      )

    case 'boolean':
      return (
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
            {title}{required ? ' *' : ''}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              style={{ borderRadius: '4px' }}
            />
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              {description || `Enable ${title.toLowerCase()}`}
            </span>
          </div>
        </div>
      )

    case 'array':
      return (
        <SchemaArrayField
          name={name}
          schema={schema}
          value={value || []}
          onChange={onChange}
          required={required}
          path={path}
        />
      )

    case 'object':
      return (
        <div>
          <h4 style={{ fontWeight: 500, marginBottom: '8px' }}>{title}{required ? ' *' : ''}</h4>
          {description && (
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>{description}</p>
          )}
          <div style={{ border: '1px solid var(--color-border)', borderRadius: '6px', padding: '16px', backgroundColor: 'var(--color-surface-light, #f9fafb)' }}>
            <SchemaObjectForm
              schema={schema}
              value={value || {}}
              onChange={onChange}
              path={path}
            />
          </div>
        </div>
      )

    default:
      // Fallback for unsupported types
      return (
        <Textarea
          label={`${title} (${fieldType})${required ? ' *' : ''}`}
          value={typeof value === 'object' ? JSON.stringify(value, null, 2) : (value || '')}
          onChange={(val) => {
            try {
              onChange(JSON.parse(val))
            } catch {
              onChange(val)
            }
          }}
          placeholder={placeholder}
          required={required}
          rows={3}
        />
      )
  }
}

interface SchemaArrayFieldProps {
  name: string
  schema: any
  value: any[]
  onChange: (value: any[]) => void
  required?: boolean
  path: string[]
}

function SchemaArrayField({ name, schema, value, onChange, required, path }: SchemaArrayFieldProps) {
  const title = schema.title || name
  const itemSchema = schema.items

  const addItem = () => {
    const defaultValue = getDefaultValue(itemSchema)
    onChange([...value, defaultValue])
  }

  const removeItem = (index: number) => {
    const newValue = value.filter((_, i) => i !== index)
    onChange(newValue)
  }

  const updateItem = (index: number, itemValue: any) => {
    const newValue = [...value]
    newValue[index] = itemValue
    onChange(newValue)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label style={{ fontSize: '14px', fontWeight: 500 }}>
          {title}{required ? ' *' : ''}
        </label>
        <button
          type="button"
          onClick={addItem}
          style={{ fontSize: '14px', color: 'var(--color-accent, #3b82f6)', cursor: 'pointer', background: 'none', border: 'none' }}
          onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
          onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
        >
          + Add Item
        </button>
      </div>

      {value.map((item, index) => (
        <div key={index} style={{ border: '1px solid var(--color-border)', borderRadius: '6px', padding: '12px', marginBottom: '8px', backgroundColor: 'var(--color-background)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Item {index + 1}</span>
            <button
              type="button"
              onClick={() => removeItem(index)}
              style={{ color: 'var(--color-error, #ef4444)', fontSize: '14px', cursor: 'pointer', background: 'none', border: 'none' }}
              onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              Remove
            </button>
          </div>
          <SchemaField
            name={`${name}[${index}]`}
            schema={itemSchema}
            value={item}
            onChange={(newValue) => updateItem(index, newValue)}
            path={[...path, index.toString()]}
          />
        </div>
      ))}

      {value.length === 0 && (
        <div style={{ fontSize: '14px', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
          No items. Click "Add Item" to add the first one.
        </div>
      )}
    </div>
  )
}

function getDefaultValue(schema: any): any {
  if (schema.default !== undefined) {
    return schema.default
  }

  switch (schema.type) {
    case 'string':
      return ''
    case 'number':
    case 'integer':
      return 0
    case 'boolean':
      return false
    case 'array':
      return []
    case 'object':
      return {}
    default:
      return null
  }
}