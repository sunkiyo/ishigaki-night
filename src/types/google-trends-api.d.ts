declare module 'google-trends-api' {
  interface InterestOverTimeOptions {
    keyword: string | string[]
    geo?: string
    startTime?: Date
    endTime?: Date
    granularTimeResolution?: boolean
  }

  function interestOverTime(options: InterestOverTimeOptions): Promise<string>

  const googleTrends: {
    interestOverTime: typeof interestOverTime
  }

  export default googleTrends
  export { interestOverTime }
}
