import { describe, it, expect } from 'vitest'
import { getDifficultyConfig, getDifficultyLabel, DIFFICULTY_CONFIG } from './difficulty'

describe('difficulty 유틸리티', () => {
  describe('DIFFICULTY_CONFIG', () => {
    it('3가지 난이도 설정이 존재해야 함', () => {
      expect(Object.keys(DIFFICULTY_CONFIG)).toHaveLength(3)
      expect(DIFFICULTY_CONFIG.easy).toBeDefined()
      expect(DIFFICULTY_CONFIG.normal).toBeDefined()
      expect(DIFFICULTY_CONFIG.hard).toBeDefined()
    })

    it('각 난이도는 필수 필드를 가져야 함', () => {
      Object.values(DIFFICULTY_CONFIG).forEach((config) => {
        expect(config).toHaveProperty('label')
        expect(config).toHaveProperty('description')
        expect(config).toHaveProperty('turnTimeLimit')
        expect(config).toHaveProperty('maxTurns')
        expect(config).toHaveProperty('color')
        expect(config).toHaveProperty('bgColor')
        expect(config).toHaveProperty('icon')
      })
    })

    it('쉬움 난이도는 가장 긴 시간과 많은 턴을 가져야 함', () => {
      expect(DIFFICULTY_CONFIG.easy.turnTimeLimit).toBeGreaterThan(DIFFICULTY_CONFIG.normal.turnTimeLimit)
      expect(DIFFICULTY_CONFIG.easy.turnTimeLimit).toBeGreaterThan(DIFFICULTY_CONFIG.hard.turnTimeLimit)
      expect(DIFFICULTY_CONFIG.easy.maxTurns).toBeGreaterThan(DIFFICULTY_CONFIG.normal.maxTurns)
      expect(DIFFICULTY_CONFIG.easy.maxTurns).toBeGreaterThan(DIFFICULTY_CONFIG.hard.maxTurns)
    })

    it('어려움 난이도는 가장 짧은 시간과 적은 턴을 가져야 함', () => {
      expect(DIFFICULTY_CONFIG.hard.turnTimeLimit).toBeLessThan(DIFFICULTY_CONFIG.normal.turnTimeLimit)
      expect(DIFFICULTY_CONFIG.hard.turnTimeLimit).toBeLessThan(DIFFICULTY_CONFIG.easy.turnTimeLimit)
      expect(DIFFICULTY_CONFIG.hard.maxTurns).toBeLessThan(DIFFICULTY_CONFIG.normal.maxTurns)
      expect(DIFFICULTY_CONFIG.hard.maxTurns).toBeLessThan(DIFFICULTY_CONFIG.easy.maxTurns)
    })
  })

  describe('getDifficultyConfig', () => {
    it('쉬움 난이도 설정을 반환해야 함', () => {
      const config = getDifficultyConfig('easy')
      expect(config).toEqual(DIFFICULTY_CONFIG.easy)
      expect(config.label).toBe('쉬움')
    })

    it('보통 난이도 설정을 반환해야 함', () => {
      const config = getDifficultyConfig('normal')
      expect(config).toEqual(DIFFICULTY_CONFIG.normal)
      expect(config.label).toBe('보통')
    })

    it('어려움 난이도 설정을 반환해야 함', () => {
      const config = getDifficultyConfig('hard')
      expect(config).toEqual(DIFFICULTY_CONFIG.hard)
      expect(config.label).toBe('어려움')
    })
  })

  describe('getDifficultyLabel', () => {
    it('쉬움 난이도 레이블을 반환해야 함', () => {
      expect(getDifficultyLabel('easy')).toBe('쉬움')
    })

    it('보통 난이도 레이블을 반환해야 함', () => {
      expect(getDifficultyLabel('normal')).toBe('보통')
    })

    it('어려움 난이도 레이블을 반환해야 함', () => {
      expect(getDifficultyLabel('hard')).toBe('어려움')
    })
  })

  describe('난이도별 게임 밸런스', () => {
    it('쉬움: 90초, 15턴', () => {
      const config = getDifficultyConfig('easy')
      expect(config.turnTimeLimit).toBe(90)
      expect(config.maxTurns).toBe(15)
    })

    it('보통: 60초, 10턴', () => {
      const config = getDifficultyConfig('normal')
      expect(config.turnTimeLimit).toBe(60)
      expect(config.maxTurns).toBe(10)
    })

    it('어려움: 30초, 7턴', () => {
      const config = getDifficultyConfig('hard')
      expect(config.turnTimeLimit).toBe(30)
      expect(config.maxTurns).toBe(7)
    })
  })
})
