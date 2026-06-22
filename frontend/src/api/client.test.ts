import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import client from './client'
import { useAuthStore } from '@/stores/auth.store'

const mock = new MockAdapter(client)
const postMock = vi.spyOn(axios, 'post')

describe('client auth interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mock.reset()
    useAuthStore.getState().clear()
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    })
  })

  it('adds bearer token when present', async () => {
    useAuthStore.getState().setToken('access-token')
    mock.onGet('/test').reply(200, { ok: true })

    const response = await client.get('/test')

    expect(response.config.headers.Authorization).toBe('Bearer access-token')
    expect(response.data).toEqual({ ok: true })
  })

  it('refreshes token once after a 401 response', async () => {
    mock.onGet('/protected').replyOnce(401).onGet('/protected').replyOnce(200, { ok: true })
    postMock.mockResolvedValueOnce({ data: { accessToken: 'new-token' } })

    const response = await client.get('/protected')

    expect(postMock).toHaveBeenCalledWith('/api/v1/auth/refresh', {}, { withCredentials: true })
    expect(useAuthStore.getState().accessToken).toBe('new-token')
    expect(response.data).toEqual({ ok: true })
  })

  it('clears session and redirects when refresh fails', async () => {
    useAuthStore.getState().setToken('expired-token')
    mock.onGet('/protected').reply(401)
    postMock.mockRejectedValueOnce(new Error('refresh failed'))

    await expect(client.get('/protected')).rejects.toThrow('refresh failed')

    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(window.location.href).toBe('/login')
  })

  it('does not retry a request that already retried', async () => {
    mock.onGet('/protected').reply(401)
    postMock.mockResolvedValueOnce({ data: { accessToken: 'new-token' } })
    mock.onGet('/protected').reply(401)

    await expect(client.get('/protected')).rejects.toMatchObject({
      response: { status: 401 },
    })

    expect(postMock).toHaveBeenCalledTimes(1)
  })
})
