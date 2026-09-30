import { NAVIGATION_ITEMS, PAGES } from '../config'

interface Props {
  activeIndex: number
  onNavigate: (pageIndex: number) => void
}

/** The single fixed navigation column. Items that match a PAGES label scroll in-page; others are normal links. */
export default function Menu({ activeIndex, onNavigate }: Props) {
  return (
    <nav className="menu">
      {NAVIGATION_ITEMS.map((item) => {
        const pageIndex = PAGES.findIndex((p) => p.label === item)
        const isPage = pageIndex !== -1
        return (
          <a
            key={item}
            href={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
            className={isPage && pageIndex === activeIndex ? 'on' : ''}
            onClick={
              isPage
                ? (e) => {
                    e.preventDefault()
                    onNavigate(pageIndex)
                  }
                : undefined
            }
          >
            {item}
          </a>
        )
      })}
    </nav>
  )
}