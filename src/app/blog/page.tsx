import Layout from "@/components/Layout";
import { getAllPosts } from "@/lib/mdx";
import Link from "next/link";

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-primary-dark mb-8">Blog</h1>
        
        <div className="grid gap-8">
          {posts.length > 0 ? (
            posts.map((post) => (
              <article key={post.slug} className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <Link href={`/blog/${post.slug}`} className="no-underline">
                  <h2 className="text-2xl font-bold text-primary hover:text-primary-dark mb-2 transition-colors">
                    {post.title}
                  </h2>
                </Link>
                <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                  <span>{new Date(post.date).toLocaleDateString()}</span>
                  <span className="mx-2">•</span>
                  <span>{post.author}</span>
                </div>
                <p className="text-neutral-700 dark:text-neutral-300 mb-4">
                  {post.excerpt}
                </p>
                <Link 
                  href={`/blog/${post.slug}`}
                  className="text-primary hover:text-primary-dark font-medium transition-colors"
                >
                  Read more →
                </Link>
              </article>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                No blog posts available yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
