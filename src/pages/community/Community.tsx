import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { avatarGradient, initials, relTime } from '../../lib/format'
import { Avatar, Card, Loader } from '../../components/ui'
import { Icon } from '../../components/Icon'

type Group = { id: string; slug: string; name: string; color: string | null }
type Post = {
  id: string; body: string; created_at: string; group_id: string | null
  author: string; groupName: string; likes: number; comments: number; liked: boolean
}
type EventRow = { id: string; title: string; starts_at: string; host: string | null }
type Leader = { user_id: string; full_name: string | null; total_points: number; rank: number }

export default function Community() {
  const { me } = useAuth()
  const { t, lang } = useI18n()
  const inst = me!.institutionId
  const [activeGroup, setActiveGroup] = useState<string>('all')
  const [composer, setComposer] = useState('')
  const [posting, setPosting] = useState(false)

  const { data, loading, reload } = useAsync(async () => {
    const [{ data: groups }, { data: posts }, { data: likes }, { data: comments }, { data: events }, { data: leaders }] = await Promise.all([
      supabase.from('community_groups').select('id, slug, name, color').eq('institution_id', inst).order('position'),
      supabase.from('posts').select('id, body, created_at, group_id, author:profiles!posts_author_profile_fkey(full_name), group:community_groups(name)').eq('institution_id', inst).order('created_at', { ascending: false }),
      supabase.from('post_likes').select('post_id, user_id'),
      supabase.from('post_comments').select('post_id'),
      supabase.from('events').select('id, title, starts_at, host:profiles!events_host_profile_fkey(full_name)').eq('institution_id', inst).order('starts_at'),
      supabase.from('leaderboard').select('user_id, full_name, total_points, rank').eq('institution_id', inst).order('rank').limit(5),
    ])
    const likeCount: Record<string, number> = {}
    const likedByMe: Record<string, boolean> = {}
    for (const l of likes ?? []) { likeCount[l.post_id] = (likeCount[l.post_id] ?? 0) + 1; if (l.user_id === me!.userId) likedByMe[l.post_id] = true }
    const commentCount: Record<string, number> = {}
    for (const c of comments ?? []) commentCount[c.post_id] = (commentCount[c.post_id] ?? 0) + 1
    const P: Post[] = (posts ?? []).map((p: any) => ({
      id: p.id, body: p.body, created_at: p.created_at, group_id: p.group_id,
      author: p.author?.full_name ?? '—', groupName: p.group?.name ?? t('all'),
      likes: likeCount[p.id] ?? 0, comments: commentCount[p.id] ?? 0, liked: !!likedByMe[p.id],
    }))
    const E: EventRow[] = (events ?? []).map((e: any) => ({ id: e.id, title: e.title, starts_at: e.starts_at, host: e.host?.full_name ?? null }))
    return { groups: (groups ?? []) as Group[], posts: P, events: E, leaders: (leaders ?? []) as Leader[] }
  }, [inst])

  const shownPosts = useMemo(() => {
    if (!data) return []
    if (activeGroup === 'all') return data.posts
    return data.posts.filter((p) => data.groups.find((g) => g.id === p.group_id)?.slug === activeGroup)
  }, [data, activeGroup])

  async function toggleLike(p: Post) {
    if (p.liked) await supabase.from('post_likes').delete().eq('post_id', p.id).eq('user_id', me!.userId)
    else await supabase.from('post_likes').insert({ post_id: p.id, user_id: me!.userId })
    reload()
  }

  async function submitPost() {
    const body = composer.trim()
    if (!body) return
    setPosting(true)
    const group_id = activeGroup === 'all' ? null : data?.groups.find((g) => g.slug === activeGroup)?.id ?? null
    await supabase.from('posts').insert({ institution_id: inst, author_id: me!.userId, body, group_id })
    setComposer('')
    setPosting(false)
    reload()
  }

  if (loading || !data) return <Loader />
  const { groups, events, leaders } = data
  const rankColor = ['#E7B450', '#9FB0C4', '#C99A2E', '#B8C2CF', '#B8C2CF']

  return (
    <div className="lmsfade" style={{ padding: '22px 30px 46px', maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 260px', gap: 20, alignItems: 'start' }}>
        {/* Groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'sticky', top: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: .7, color: '#8494A8', textTransform: 'uppercase', padding: '2px 10px 6px' }}>{t('groups')}</div>
          {[{ id: 'all', slug: 'all', name: t('all'), color: '#D9A441' } as Group, ...groups].map((g) => {
            const active = activeGroup === g.slug
            const count = g.slug === 'all' ? data.posts.length : data.posts.filter((p) => p.group_id === g.id).length
            return (
              <button key={g.slug} onClick={() => setActiveGroup(g.slug)} style={{ display: 'flex', alignItems: 'center', gap: 9, height: 40, padding: '0 12px', borderRadius: 11, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: active ? '#fff' : 'transparent', color: active ? 'var(--navy-800)' : '#5B6B82', boxShadow: active ? 'var(--shadow-sm)' : 'none' }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: g.color ?? '#1B5FB0' }} />
                <span style={{ flex: 1, textAlign: 'left' }}>{g.name}</span>
                <span style={{ fontSize: 11, color: '#9AA7B8', fontWeight: 700 }}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card style={{ padding: '15px 16px', display: 'flex', gap: 12, alignItems: 'center', borderRadius: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, flex: 'none', background: 'linear-gradient(135deg,#0F2C4C,#1B4B7F)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14 }}>{initials(me!.fullName)}</div>
            <input value={composer} onChange={(e) => setComposer(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submitPost() }} placeholder={t('shareSomething')} style={{ flex: 1, height: 42, border: '1px solid var(--border)', borderRadius: 11, background: '#F7F9FC', padding: '0 14px', fontSize: 13.5, outline: 'none' }} />
            <button onClick={submitPost} disabled={posting || !composer.trim()} style={{ height: 42, padding: '0 18px', borderRadius: 11, background: '#D9A441', color: '#0F2C4C', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', opacity: composer.trim() ? 1 : .6 }}>{t('post')}</button>
          </Card>

          {shownPosts.map((p) => (
            <Card key={p.id} style={{ padding: '17px 18px', borderRadius: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 11 }}>
                <Avatar name={p.author} size={42} radius={11} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--navy-800)' }}>{p.author}</div>
                  <div style={{ fontSize: 11.5, color: '#9AA7B8', fontWeight: 600 }}>{p.groupName} · {relTime(p.created_at, lang)}</div>
                </div>
                <Icon name="more-horizontal" size={18} color="#B8C2CF" />
              </div>
              <div style={{ fontSize: 13.5, color: '#33415A', lineHeight: 1.55, marginBottom: 13 }}>{p.body}</div>
              <div style={{ display: 'flex', gap: 20, paddingTop: 11, borderTop: '1px solid var(--border-soft)' }}>
                <button onClick={() => toggleLike(p)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none', color: p.liked ? '#D14343' : '#8494A8' }}>
                  <Icon name="heart" size={15} fill={p.liked ? '#D14343' : 'none'} />{p.likes}
                </button>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#8494A8', fontWeight: 700 }}><Icon name="message-circle" size={15} />{p.comments}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#8494A8', fontWeight: 700 }}><Icon name="share-2" size={15} />{t('share')}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Right rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 0 }}>
          <Card style={{ padding: '16px 17px', borderRadius: 14 }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: 'var(--navy-800)', marginBottom: 13, display: 'flex', alignItems: 'center', gap: 7 }}><Icon name="calendar" size={16} color="#D9A441" />{t('upcomingEvents')}</div>
            {events.map((e) => {
              const d = new Date(e.starts_at)
              const mon = d.toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'fr-FR', { month: 'short' }).toUpperCase().replace('.', '')
              const time = d.toLocaleTimeString(lang === 'en' ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })
              return (
                <div key={e.id} style={{ display: 'flex', gap: 11, padding: '9px 0', borderTop: '1px solid #F3F6FA' }}>
                  <div style={{ width: 44, flex: 'none', textAlign: 'center', background: '#F2F6FB', borderRadius: 9, padding: '6px 0' }}>
                    <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: 'var(--navy-800)', lineHeight: 1 }}>{d.getDate()}</div>
                    <div style={{ fontSize: 9.5, color: '#8494A8', fontWeight: 800 }}>{mon}</div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--navy-800)', lineHeight: 1.3 }}>{e.title}</div>
                    <div style={{ fontSize: 11, color: '#9AA7B8', fontWeight: 600, marginTop: 2 }}><Icon name="radio" size={11} color="#D14343" style={{ verticalAlign: -1 }} /> {time}{e.host ? ` · ${e.host}` : ''}</div>
                  </div>
                </div>
              )
            })}
          </Card>

          <Card style={{ padding: '16px 17px', borderRadius: 14 }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: 'var(--navy-800)', marginBottom: 13, display: 'flex', alignItems: 'center', gap: 7 }}><Icon name="trophy" size={16} color="#D9A441" />{t('leaderboard')}</div>
            {leaders.map((l, i) => (
              <div key={l.user_id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 0', borderTop: '1px solid #F3F6FA' }}>
                <span style={{ width: 22, height: 22, flex: 'none', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 11, color: i === 0 ? '#0F2C4C' : '#fff', background: rankColor[i] ?? '#B8C2CF' }}>{l.rank}</span>
                <div style={{ width: 30, height: 30, borderRadius: 8, flex: 'none', background: avatarGradient(l.full_name), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, fontFamily: 'var(--display)' }}>{initials(l.full_name)}</div>
                <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: 'var(--navy-800)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.full_name}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#C99A2E' }}>{l.total_points}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}
