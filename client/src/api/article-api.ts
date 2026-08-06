import { apiRequest } from './client'
import type { Article, ArticleStatus, Pagination } from '../types'

export interface ArticleFilters {
  readonly search?: string
  readonly categoryId?: number | ''
  readonly status?: ArticleStatus | ''
  readonly page?: number
  readonly limit?: number
}

export interface ArticleInput {
  readonly title: string
  readonly content: string
  readonly status: ArticleStatus
  readonly categoryIds: number[]
}

export function getArticles(filters: ArticleFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== undefined) params.set(key, String(value))
  })
  const query = params.size ? `?${params.toString()}` : ''
  return apiRequest<{ articles: Article[]; pagination: Pagination }>(
    `/articles${query}`,
  )
}

export function getArticle(slug: string) {
  return apiRequest<{ article: Article }>(`/articles/${slug}`)
}

export function createArticle(input: ArticleInput) {
  return apiRequest<{ article: Article }>('/articles', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateArticle(slug: string, input: ArticleInput) {
  return apiRequest<{ article: Article }>(`/articles/${slug}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}
