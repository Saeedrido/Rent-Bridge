const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function mockRequest<T>(data: T, ms = 200): Promise<T> {
  await delay(ms)
  return structuredClone(data)
}
