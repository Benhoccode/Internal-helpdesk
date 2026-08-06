import { CalendarDays, Edit3, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getArticle } from '../api/article-api'
import { articleStatusLabels } from '../data/navigation'
import { useAuth } from '../hooks/use-auth'
import type { Article } from '../types'
import { formatDate } from '../utils/format'

export function ArticleDetailPage() {
  const { slug = '' } = useParams()
  const [article, setArticle] = useState<Article | null>(null)
  const [error, setError] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    let active = true
    getArticle(slug)
      .then(({ article: data }) => {
        if (active) setArticle(data)
      })
      .catch(() => {
        if (active) setError('Không tìm thấy bài viết hoặc bạn không có quyền truy cập')
      })
    return () => { active = false }
  }, [slug])

  if (error) return <div className="form-error">{error}</div>
  if (!article) return <div className="state-message">Đang tải bài viết...</div>

  return (
    <div className="article-detail page-stack">
      <div className="breadcrumbs"><Link to="/knowledge">Cơ sở kiến thức</Link><span>/</span><strong>{article.title}</strong></div>
      <article className="panel article-content">
        <div className="article-content__topline">
          <div className="article-card__categories">{article.categoryLinks.map(({ category }) => <span key={category.id}>{category.name}</span>)}</div>
          {user?.role === 'ADMIN' && <Link className="secondary-button" to={`/knowledge/${article.slug}/edit`}><Edit3 size={17} /> Chỉnh sửa</Link>}
        </div>
        <h1>{article.title}</h1>
        <div className="article-content__meta"><span><UserRound size={16} /> {article.author.fullName}</span><span><CalendarDays size={16} /> Cập nhật {formatDate(article.updatedAt)}</span>{user?.role === 'ADMIN' && <span className={`article-status article-status--${article.status.toLowerCase()}`}>{articleStatusLabels[article.status]}</span>}</div>
        <div className="article-body">{article.content.split('\n').map((paragraph, index) => paragraph ? <p key={`${index}-${paragraph.slice(0, 10)}`}>{paragraph}</p> : <br key={`space-${index}`} />)}</div>
      </article>
    </div>
  )
}
