'use client'

import { FormEvent, useMemo, useState } from 'react'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'

type FormData = {
  userName: string
  contactPhone: string
  contactEmail: string
  issueCategory: string
  issueDescription: string
}

type FormErrors = Partial<Record<keyof FormData, string>>

const initialValues: FormData = {
  userName: '',
  contactPhone: '',
  contactEmail: '',
  issueCategory: '',
  issueDescription: '',
}

export default function SupportFeedbackForm() {
  const [formData, setFormData] = useState<FormData>(initialValues)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const isFormDirty = useMemo(
    () => Object.values(formData).some((value) => value.trim().length > 0),
    [formData]
  )

  const validate = (): boolean => {
    const errors: FormErrors = {}

    if (!formData.userName.trim()) {
      errors.userName = 'Please provide your name.'
    }
    if (!formData.contactPhone.trim()) {
      errors.contactPhone = 'Please provide a phone number.'
    }
    if (!formData.issueDescription.trim()) {
      errors.issueDescription = 'Please describe the issue you are facing.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSuccessMessage('')
    setErrorMessage('')

    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/support/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: formData.userName.trim(),
          contactPhone: formData.contactPhone.trim(),
          contactEmail: formData.contactEmail.trim() || undefined,
          issueCategory: formData.issueCategory.trim() || undefined,
          issueDescription: formData.issueDescription.trim(),
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.details || 'Failed to submit your feedback.')
      }

      setSuccessMessage('Thank you for the detailed feedback. Our team will reach out soon.')
      setFormData(initialValues)
      setFormErrors({})
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while sending your feedback. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      noValidate
    >
      {successMessage && (
        <Alert variant="success" title="Feedback Submitted">
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" title="Submission Failed">
          {errorMessage}
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          value={formData.userName}
          onChange={(event) => setFormData((prev) => ({ ...prev, userName: event.target.value }))}
          error={formErrors.userName}
          required
        />
        <Input
          label="Contact Phone"
          type="tel"
          placeholder="+1 (555) 000-0000"
          value={formData.contactPhone}
          onChange={(event) => setFormData((prev) => ({ ...prev, contactPhone: event.target.value }))}
          error={formErrors.contactPhone}
          required
        />
        <Input
          label="Contact Email"
          type="email"
          placeholder="your.email@example.com"
          value={formData.contactEmail}
          onChange={(event) => setFormData((prev) => ({ ...prev, contactEmail: event.target.value }))}
        />
        <Input
          label="Issue Category"
          placeholder="E.g. Billing, Technical Support, Product Feedback"
          value={formData.issueCategory}
          onChange={(event) => setFormData((prev) => ({ ...prev, issueCategory: event.target.value }))}
        />
      </div>

      <Textarea
        label="Describe the bottlenecks or issues you encountered"
        placeholder="Share the detailed context, steps to reproduce, and any expectation gap."
        minLength={20}
        rows={6}
        value={formData.issueDescription}
        onChange={(event) =>
          setFormData((prev) => ({ ...prev, issueDescription: event.target.value }))
        }
        error={formErrors.issueDescription}
        required
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          We aim to respond within 24 hours during business days.
        </p>
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          disabled={isSubmitting || !isFormDirty}
        >
          Submit Feedback
        </Button>
      </div>
    </form>
  )
}

