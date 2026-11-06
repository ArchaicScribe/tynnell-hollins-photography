// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GoogleSignInButton } from './GoogleSignInButton'

function showError(reason: string) {
  window.history.pushState({}, '', `/admin/login?sso_error=${reason}`)
  render(<GoogleSignInButton />)
  return screen.getByRole('alert').textContent ?? ''
}

afterEach(() => window.history.pushState({}, '', '/'))

describe('GoogleSignInButton error messages', () => {
  it('tells someone with no account which email to use, without calling them an admin', () => {
    const message = showError('user_not_found')

    expect(message).toMatch(/no account uses that google email/i)
    expect(message).toMatch(/password/i)
    expect(message).not.toMatch(/admin/i)
  })

  it('does not suggest retrying when Google could not vouch for the account', () => {
    const message = showError('invalid_token')

    expect(message).not.toMatch(/try again/i)
    expect(message).toMatch(/verified/i)
  })

  it('says sign-in was interrupted when the state check fails', () => {
    expect(showError('invalid_state')).toMatch(/interrupted/i)
  })

  it('shows nothing when there is no error', () => {
    window.history.pushState({}, '', '/admin/login')
    render(<GoogleSignInButton />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in with google/i })).toHaveAttribute('href', '/api/auth/google')
  })
})
