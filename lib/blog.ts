import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;         // YYYY-MM-DD
  author: string;
  category: string;
  image: string;        // ruta relativa a /public
  imageAlt: string;
  readTime: number;     // minutos
  featured?: boolean;
}

export interface Post extends PostMeta {
  content: string;
}

function getSlug(filename: string) {
  return filename.replace(/\.mdx$/, '');
}

export function getAllPosts(): PostMeta[] {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'));
  return files
    .map((filename) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf-8');
      const { data } = matter(raw);
      return { slug: getSlug(filename), ...(data as Omit<PostMeta, 'slug'>) };
    })
    .sort((a, b) => (a.date > b.date ? -1 : 1)); // más reciente primero
}

export function getPost(slug: string): Post {
  const filepath = path.join(BLOG_DIR, `${slug}.mdx`);
  const raw = fs.readFileSync(filepath, 'utf-8');
  const { data, content } = matter(raw);
  return { slug, ...(data as Omit<PostMeta, 'slug'>), content };
}

export function getAllSlugs(): string[] {
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map(getSlug);
}
