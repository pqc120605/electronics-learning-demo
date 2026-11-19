export function mockAnswer(input) {
  const source = input.evidence.find(item => item.id !== 'S0') ?? input.evidence[0]
  return {
    status: 'answered',
    answer: `${source.text.trim().slice(0, 560)} [${source.id}]`,
    sourceIds: [source.id],
    followUps: [],
  }
}
