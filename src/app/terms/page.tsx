import Layout from "@/components/Layout";

export default function TermsPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-primary-dark mb-6">Terms of Service</h1>
        
        <div className="prose dark:prose-invert max-w-none">
          <p>Last updated: April 19, 2025</p>
          
          <h2>Introduction</h2>
          <p>
            These terms and conditions outline the rules and regulations for the use of Community Learning Hub's website.
            By accessing this website, we assume you accept these terms and conditions in full. Do not continue to use
            Community Learning Hub's website if you do not accept all of the terms and conditions stated on this page.
          </p>
          
          <h2>License</h2>
          <p>
            Unless otherwise stated, Community Learning Hub and/or its licensors own the intellectual property rights for
            all material on Community Learning Hub. All intellectual property rights are reserved. You may view and/or print
            pages from the website for your own personal use subject to restrictions set in these terms and conditions.
          </p>
          
          <h3>You must not:</h3>
          <ul>
            <li>Republish material from this website</li>
            <li>Sell, rent or sub-license material from this website</li>
            <li>Reproduce, duplicate or copy material from this website</li>
            <li>Redistribute content from Community Learning Hub (unless content is specifically made for redistribution)</li>
          </ul>
          
          <h2>User Content</h2>
          <p>
            In these terms and conditions, "User Content" means material (including without limitation text, images, audio
            material, video material and audio-visual material) that you submit to this website, for whatever purpose.
          </p>
          <p>
            You grant to Community Learning Hub a worldwide, irrevocable, non-exclusive, royalty-free license to use,
            reproduce, adapt, publish, translate and distribute your User Content in any existing or future media. You
            also grant to Community Learning Hub the right to sub-license these rights, and the right to bring an action
            for infringement of these rights.
          </p>
          
          <h2>Limitation of Liability</h2>
          <p>
            In no event shall Community Learning Hub, nor any of its officers, directors and employees, be held liable for
            anything arising out of or in any way connected with your use of this website, whether such liability is under
            contract, tort or otherwise.
          </p>
          
          <h2>Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws, and you irrevocably submit
            to the exclusive jurisdiction of the courts in that location.
          </p>
        </div>
      </div>
    </Layout>
  );
}
