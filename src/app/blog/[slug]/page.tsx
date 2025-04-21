import Layout from "@/components/Layout";
import { getPostBySlug, getAllPosts, compileMdxToHtml } from "@/lib/mdx";
import Link from "next/link";
import { notFound } from "next/navigation";

// Generate static paths for all blog posts
export async function generateStaticParams() {
  const posts = await getAllPosts();
  
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Let's simplify this component to avoid type issues
export default async function BlogPostPage({ params }: any) {
  const post = await getPostBySlug(params.slug);
  
  if (!post) {
    notFound();
  }
  
  const content = await compileMdxToHtml(post.content);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-8">
        <Link 
          href="/blog"
          className="inline-block mb-6 text-primary hover:text-primary-dark transition-colors"
        >
          &larr; Back to all posts
        </Link>
        
        <article className="prose dark:prose-invert prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-primary-dark mb-2">{post.title}</h1>
          
          <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400 mb-8">
            <span>{new Date(post.date).toLocaleDateString()}</span>
            <span className="mx-2">&middot;</span>
            <span>{post.author}</span>
          </div>
          
          <div className="mt-8">
            {content}
          </div>
        </article>
      </div>
    </Layout>
  );
}
