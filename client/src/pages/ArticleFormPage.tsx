import { Save } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createArticle, getArticle, updateArticle } from '../api/article-api'
import { ApiError } from '../api/client'
import { getCategories } from '../api/ticket-api'
import type { ArticleStatus, Category } from '../types'

export function ArticleFormPage() {
  const { slug } = useParams()
  const editing = Boolean(slug)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<ArticleStatus>('DRAFT')
  const [categoryIds, setCategoryIds] = useState<number[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getCategories()
      .then(({ categories: data }) => setCategories(data))
      .catch(() => setError('Không thể tải danh mục'))
  }, [])

  useEffect(() => {
    if (!slug) return
    let active = true
    getArticle(slug)
      .then(({ article }) => {
        if (!active) return
        setTitle(article.title)
        setContent(article.content)
        setStatus(article.status)
        setCategoryIds(article.categoryLinks.map((link) => link.categoryId))
      })
      .catch(() => {
        if (active) setError('Không thể tải bài viết')
      })
    return () => { active = false }
  }, [slug])

  const toggleCategory = (categoryId: number) => {
    setCategoryIds((current) => current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId])
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (categoryIds.length === 0) {
      setError('Hãy chọn ít nhất một danh mục')
      return
    }
    setSaving(true)
    setError('')
    try {
      const input = { title, content, status, categoryIds }
      const result = editing && slug ? await updateArticle(slug, input) : await createArticle(input)
      navigate(`/knowledge/${result.article.slug}`)
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'Không thể lưu bài viết')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack article-form-page">
      <div className="breadcrumbs"><Link to="/knowledge/manage">Quản lý bài viết</Link><span>/</span><strong>{editing ? 'Chỉnh sửa' : 'Bài viết mới'}</strong></div>
      <div className="page-heading"><h1>{editing ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}</h1><p>Nội dung rõ ràng giúp nhân viên tự xử lý vấn đề nhanh hơn.</p></div>
      <form className="panel article-form" onSubmit={handleSubmit}>
        <label htmlFor="article-title">Tiêu đề <span>*</span></label><input id="article-title" value={title} onChange={(event) => setTitle(event.target.value)} minLength={5} maxLength={250} required />
        <label>Danh mục <span>*</span></label><div className="category-checkboxes">{categories.map((category) => <label key={category.id}><input type="checkbox" checked={categoryIds.includes(category.id)} onChange={() => toggleCategory(category.id)} /> {category.name}</label>)}</div>
        <label htmlFor="article-status">Trạng thái <span>*</span></label><select id="article-status" value={status} onChange={(event) => setStatus(event.target.value as ArticleStatus)}><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Xuất bản</option><option value="ARCHIVED">Lưu trữ</option></select>
        <label htmlFor="article-content">Nội dung <span>*</span></label><textarea id="article-content" value={content} onChange={(event) => setContent(event.target.value)} minLength={20} maxLength={50000} rows={18} placeholder="Viết từng bước hướng dẫn, điều kiện và kết quả mong đợi..." required />
        {error && <div className="form-error">{error}</div>}
        <div className="form-actions"><Link className="secondary-button" to="/knowledge/manage">Hủy</Link><button className="primary-button" disabled={saving}><Save size={17} /> {saving ? 'Đang lưu...' : 'Lưu bài viết'}</button></div>
      </form>
    </div>
  )
}
