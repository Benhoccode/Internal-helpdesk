import { ArrowRight, CalendarDays, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { articleStatusLabels } from '../../data/navigation'
import type { Article } from '../../types'
import { formatDate } from '../../utils/format'

interface ArticleCardProps {
  readonly article: Article
  readonly showStatus?: boolean
}

export function ArticleCard({
  article,
  showStatus = false,
}: Readonly<ArticleCardProps>) {
  const summary = article.content.replace(/\s+/g, ' ').slice(0, 150)

  return (
    <article className="article-card">
      <div className="article-card__categories">
        {article.categoryLinks.map(({ category }) => (
          <span key={category.id}>{category.name}</span>
        ))}
        {showStatus && (
          <span className={`article-status article-status--${article.status.toLowerCase()}`}>
            {articleStatusLabels[article.status]}
          </span>
        )}
      </div>
      <h2><Link to={`/knowledge/${article.slug}`}>{article.title}</Link></h2>
      <p>{summary}{article.content.length > 150 ? '…' : ''}</p>
      <div className="article-card__meta">
        <span><UserRound size={15} /> {article.author.fullName}</span>
        <span><CalendarDays size={15} /> {formatDate(article.updatedAt)}</span>
      </div>
      <Link className="article-card__link" to={`/knowledge/${article.slug}`}>
        Đọc bài viết <ArrowRight size={16} />
      </Link>
    </article>
  )
}
