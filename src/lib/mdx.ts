import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { compileMDX } from 'next-mdx-remote/rsc';

const contentDirectory = path.join(process.cwd(), 'src/content');

export interface PostMetadata {
  title: string;
  date: string;
  author: string;
  excerpt: string;
  slug: string;
}

export interface Post extends PostMetadata {
  content: string;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const filePath = path.join(contentDirectory, 'blog', `${slug}.mdx`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);
    
    return {
      title: data.title,
      date: data.date,
      author: data.author,
      excerpt: data.excerpt,
      slug,
      content,
    };
  } catch (error) {
    console.error(`Error getting post by slug: ${slug}`, error);
    return null;
  }
}

export async function getAllPosts(): Promise<PostMetadata[]> {
  try {
    const blogDir = path.join(contentDirectory, 'blog');
    const filenames = fs.readdirSync(blogDir);
    
    const posts = filenames
      .filter(filename => filename.endsWith('.mdx'))
      .map(filename => {
        const filePath = path.join(blogDir, filename);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(fileContent);
        const slug = filename.replace(/\.mdx$/, '');
        
        return {
          title: data.title,
          date: data.date,
          author: data.author,
          excerpt: data.excerpt,
          slug,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return posts;
  } catch (error) {
    console.error('Error getting all posts', error);
    return [];
  }
}

export async function compileMdxToHtml(source: string) {
  const { content } = await compileMDX({
    source,
    options: { parseFrontmatter: true },
  });
  
  return content;
}
