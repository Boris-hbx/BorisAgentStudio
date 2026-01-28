/**
 * GitHubTrending - GitHub 热门项目列表
 */

import type { GitHubProject } from '../../types/insight'
import { ProjectCard } from './ProjectCard'

interface GitHubTrendingProps {
  projects: GitHubProject[]
}

export function GitHubTrending({ projects }: GitHubTrendingProps) {
  if (!projects || projects.length === 0) {
    return (
      <section className="insight-section">
        <h3 className="section-title">
          <span className="section-icon">📈</span>
          GitHub 热门项目
        </h3>
        <div className="section-empty">暂无数据</div>
      </section>
    )
  }

  return (
    <section className="insight-section">
      <h3 className="section-title">
        <span className="section-icon">📈</span>
        GitHub 热门项目
        <span className="section-subtitle">(7天增长)</span>
      </h3>
      <div className="project-list">
        {projects.map((project, index) => (
          <ProjectCard key={project.name} project={project} rank={index + 1} />
        ))}
      </div>
    </section>
  )
}
