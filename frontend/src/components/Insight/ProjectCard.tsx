/**
 * ProjectCard - GitHub 项目卡片
 */

import type { GitHubProject } from '../../types/insight'

interface ProjectCardProps {
  project: GitHubProject
  rank?: number
}

/** 语言颜色映射 */
const LANGUAGE_COLORS: Record<string, string> = {
  Python: '#3572A5',
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
}

export function ProjectCard({ project }: ProjectCardProps) {
  const languageColor = LANGUAGE_COLORS[project.language] || '#8b949e'

  const formatStars = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className="project-card"
    >
      <div className="project-header">
        <span className="project-growth">
          <span className="growth-icon">⭐</span>
          <span className="growth-value">+{project.stars_growth_7d}</span>
        </span>
        <span className="project-name">{project.name}</span>
      </div>

      <p className="project-description">{project.description}</p>

      <div className="project-meta">
        {project.language && (
          <span className="project-language">
            <span
              className="language-dot"
              style={{ backgroundColor: languageColor }}
            />
            {project.language}
          </span>
        )}
        <span className="project-stars">
          <span className="star-icon">⭐</span>
          {formatStars(project.stars)}
        </span>
        {project.forks > 0 && (
          <span className="project-forks">
            <span className="fork-icon">🍴</span>
            {formatStars(project.forks)}
          </span>
        )}
      </div>

      {project.topics && project.topics.length > 0 && (
        <div className="project-topics">
          {project.topics.slice(0, 4).map(topic => (
            <span key={topic} className="project-topic">{topic}</span>
          ))}
        </div>
      )}
    </a>
  )
}
