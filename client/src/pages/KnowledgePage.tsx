import { BookOpen, Plus, Search } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getArticles, type ArticleFilters } from '../api/article-api'
import { getCategories } from '../api/ticket-api'
import { ArticleCard } from '../components/knowledge/ArticleCard'
import type { Article, ArticleStatus, Category, Pagination } from '../types'

interface KnowledgePageProps {
  readonly management?: boolean
}

export function KnowledgePage({
  management = false,
}: Readonly<KnowledgePageProps>) {
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [filters, setFilters] = useState<ArticleFilters>({
    page: 1,
    limit: 9,
    ...(management ? {} : { status: 'PUBLISHED' }),
  })
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getCategories()
      .then(({ categories: data }) => setCategories(data))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    let active = true
    getArticles(filters)
      .then((result) => {
        if (!active) return
        setArticles(result.articles)
        setPagination(result.pagination)
        setError('')
      })
      .catch(() => {
        if (active) setError('Không thể tải danh sách bài viết')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [filters])

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    setFilters((current) => ({ ...current, search: searchInput, page: 1 }))
  }

  return (
    <div className="page-stack knowledge-page">
      <div className="knowledge-hero">
        <BookOpen size={34} />
        <div>
          <h1>{management ? 'Quản lý bài viết' : 'Cơ sở kiến thức'}</h1>
          <p>{management ? 'Tạo, xuất bản và lưu trữ hướng dẫn nội bộ.' : 'Tìm hướng dẫn để tự giải quyết vấn đề trước khi tạo yêu cầu.'}</p>
        </div>
        {management && <Link className="primary-button" to="/knowledge/new"><Plus size={18} /> Bài viết mới</Link>}
      </div>

      <section className="filter-bar knowledge-filters">
        <form className="search-input" onSubmit={submitSearch}><Search size={19} /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tìm theo tiêu đề hoặc nội dung..." /></form>
        <select value={filters.categoryId ?? ''} onChange={(event) => setFilters((current) => ({ ...current, categoryId: event.target.value ? Number(event.target.value) : '', page: 1 }))}>
          <option value="">Tất cả danh mục</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        {management && <select value={filters.status ?? ''} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as ArticleStatus | '', page: 1 }))}><option value="">Tất cả trạng thái</option><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Đã xuất bản</option><option value="ARCHIVED">Đã lưu trữ</option></select>}
      </section>

      {error && <div className="form-error">{error}</div>}
      {loading ? <div className="state-message">Đang tải bài viết...</div> : (
        <section className="article-grid">
          {articles.map((article) => <ArticleCard key={article.id} article={article} showStatus={management} />)}
          {articles.length === 0 && <div className="empty-feature panel"><BookOpen size={38} /><h2>Chưa có bài viết phù hợp</h2><p>Hãy thử thay đổi từ khóa hoặc bộ lọc.</p></div>}
        </section>
      )}

      {pagination && pagination.totalPages > 1 && <nav className="pagination" aria-label="Phân trang bài viết"><button disabled={pagination.page === 1} onClick={() => setFilters((current) => ({ ...current, page: pagination.page - 1 }))}>Trước</button><span>Trang {pagination.page} / {pagination.totalPages}</span><button disabled={pagination.page === pagination.totalPages} onClick={() => setFilters((current) => ({ ...current, page: pagination.page + 1 }))}>Sau</button></nav>}
    </div>
  )
}
