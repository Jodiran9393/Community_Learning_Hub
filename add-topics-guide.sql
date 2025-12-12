-- ============================================
-- GUIDE: Adding 50+ Topics to Your Galaxy
-- ============================================
-- Copy sections below and run in Supabase SQL Editor
-- Topics will appear in galaxy immediately after insert!

-- ============================================
-- WEB DEVELOPMENT (20 topics)
-- ============================================

INSERT INTO learning_topics (id, name, slug, category, difficulty_level, estimated_hours, prerequisites, icon_emoji, node_size, display_order, resource_page_url) VALUES
-- Existing: HTML, CSS, JS, React, NextJS, TS (already in DB)

-- Additional Frontend Frameworks
('Vue', 'Vue.js', 'vue-js', 'web', 3, 30, '{JS}', '🟢', 25, 20, '/pages/vue.html'),
('Angular', 'Angular', 'angular', 'web', 4, 35, '{JS,TS}', '🔺', 25, 21, '/pages/angular.html'),
('Svelte', 'Svelte', 'svelte', 'web', 3, 25, '{JS}', '🧡', 20, 22, '/pages/svelte.html'),
('Nuxt', 'Nuxt.js', 'nuxtjs', 'web', 4, 20, '{Vue}', '💚', 20, 23, '/pages/nuxt.html'),
('Remix', 'Remix', 'remix', 'web', 4, 18, '{React}', '💿', 20, 24, '/pages/remix.html'),

-- Build Tools & Bundlers
('Webpack', 'Webpack', 'webpack', 'web', 3, 15, '{JS}', '📦', 15, 25, '/pages/webpack.html'),
('Vite', 'Vite', 'vite', 'web', 2, 10, '{JS}', '⚡', 15, 26, '/pages/vite.html'),
('Rollup', 'Rollup', 'rollup', 'web', 3, 12, '{JS}', '📜', 15, 27, '/pages/rollup.html'),

-- CSS Frameworks & Preprocessors
('Tailwind', 'Tailwind CSS', 'tailwind', 'web', 2, 10, '{CSS}', '🎨', 18, 28, '/pages/tailwind.html'),
('Sass', 'Sass/SCSS', 'sass', 'web', 2, 8, '{CSS}', '🌸', 15, 29, '/pages/sass.html'),
('Bootstrap', 'Bootstrap', 'bootstrap', 'web', 2, 10, '{CSS}', '🅱️', 15, 30, '/pages/bootstrap.html'),

-- Testing
('Jest', 'Jest', 'jest', 'web', 3, 15, '{JS}', '🃏', 18, 31, '/pages/jest.html'),
('Cypress', 'Cypress', 'cypress', 'web', 3, 18, '{JS}', '🌲', 18, 32, '/pages/cypress.html'),
('Playwright', 'Playwright', 'playwright', 'web', 3, 16, '{JS}', '🎭', 18, 33, '/pages/playwright.html'),

-- Web APIs & Advanced
('WebGL', 'WebGL', 'webgl', 'web', 4, 30, '{JS}', '🎮', 20, 34, '/pages/webgl.html'),
('PWA', 'Progressive Web Apps', 'pwa', 'web', 3, 20, '{JS,HTML,CSS}', '📱', 18, 35, '/pages/pwa.html'),
('WebSockets', 'WebSockets', 'websockets', 'web', 3, 12, '{JS}', '🔌', 15, 36, '/pages/websockets.html'),
('GraphQL', 'GraphQL', 'graphql', 'web', 3, 20, '{JS}', '◐', 20, 37, '/pages/graphql.html'),
('REST', 'REST APIs', 'rest-api', 'web', 2, 15, '{JS}', '🌐', 18, 38, '/pages/rest.html'),
('OAuth', 'OAuth & Auth', 'oauth', 'web', 3, 12, '{JS}', '🔐', 15, 39, '/pages/oauth.html')

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- BACKEND DEVELOPMENT (15 topics)
-- ============================================

INSERT INTO learning_topics (id, name, slug, category, difficulty_level, estimated_hours, prerequisites, icon_emoji, node_size, display_order, resource_page_url) VALUES
-- Existing: Python (already in DB)

-- Backend Languages
('NodeJS', 'Node.js', 'nodejs', 'backend', 3, 25, '{JS}', '🟢', 25, 50, '/pages/nodejs.html'),
('Go', 'Golang', 'golang', 'backend', 3, 30, '{}', '🐹', 25, 51, '/pages/go.html'),
('Rust', 'Rust', 'rust', 'backend', 4, 40, '{}', '🦀', 25, 52, '/pages/rust.html'),
('Java', 'Java', 'java', 'backend', 3, 35, '{}', '☕', 25, 53, '/pages/java.html'),
('PHP', 'PHP', 'php', 'backend', 2, 25, '{}', '🐘', 20, 54, '/pages/php.html'),
('Ruby', 'Ruby', 'ruby', 'backend', 3, 28, '{}', '💎', 20, 55, '/pages/ruby.html'),

-- Backend Frameworks
('Django', 'Django', 'django', 'backend', 3, 30, '{Python}', '🎸', 22, 56, '/pages/django.html'),
('FastAPI', 'FastAPI', 'fastapi', 'backend', 3, 20, '{Python}', '⚡', 20, 57, '/pages/fastapi.html'),
('Express', 'Express.js', 'expressjs', 'backend', 2, 18, '{NodeJS}', '🚂', 20, 58, '/pages/express.html'),
('NestJS', 'NestJS', 'nestjs', 'backend', 4, 25, '{NodeJS,TS}', '🐈', 20, 59, '/pages/nestjs.html'),
('Rails', 'Ruby on Rails', 'rails', 'backend', 3, 30, '{Ruby}', '🛤️', 22, 60, '/pages/rails.html'),
('Spring', 'Spring Boot', 'spring', 'backend', 4, 30, '{Java}', '🍃', 22, 61, '/pages/spring.html'),
('Laravel', 'Laravel', 'laravel', 'backend', 3, 25, '{PHP}', '🔧', 20, 62, '/pages/laravel.html'),

-- Message Queues & Background Jobs
('Redis', 'Redis', 'redis', 'backend', 3, 15, '{}', '🔴', 18, 63, '/pages/redis.html'),
('RabbitMQ', 'RabbitMQ', 'rabbitmq', 'backend', 3, 18, '{}', '🐰', 18, 64, '/pages/rabbitmq.html')

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DATABASES (10 topics)
-- ============================================

INSERT INTO learning_topics (id, name, slug, category, difficulty_level, estimated_hours, prerequisites, icon_emoji, node_size, display_order, resource_page_url) VALUES
('PostgreSQL', 'PostgreSQL', 'postgresql', 'backend', 3, 25, '{}', '🐘', 25, 70, '/pages/postgresql.html'),
('MongoDB', 'MongoDB', 'mongodb', 'backend', 2, 20, '{}', '🍃', 22, 71, '/pages/mongodb.html'),
('MySQL', 'MySQL', 'mysql', 'backend', 2, 20, '{}', '🐬', 20, 72, '/pages/mysql.html'),
('SQLite', 'SQLite', 'sqlite', 'backend', 2, 12, '{}', '📦', 15, 73, '/pages/sqlite.html'),
('Supabase', 'Supabase', 'supabase', 'backend', 2, 15, '{PostgreSQL}', '⚡', 20, 74, '/pages/supabase.html'),
('Firebase', 'Firebase', 'firebase', 'backend', 2, 18, '{}', '🔥', 20, 75, '/pages/firebase.html'),
('Prisma', 'Prisma ORM', 'prisma', 'backend', 3, 15, '{NodeJS}', '💎', 18, 76, '/pages/prisma.html'),
('SQL', 'SQL Fundamentals', 'sql', 'backend', 2, 20, '{}', '🗄️', 20, 77, '/pages/sql.html'),
('Elasticsearch', 'Elasticsearch', 'elasticsearch', 'backend', 4, 25, '{}', '🔍', 20, 78, '/pages/elasticsearch.html'),
('DynamoDB', 'AWS DynamoDB', 'dynamodb', 'backend', 3, 18, '{}', '💫', 18, 79, '/pages/dynamodb.html')

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- AI & MACHINE LEARNING (12 topics)
-- ============================================

INSERT INTO learning_topics (id, name, slug, category, difficulty_level, estimated_hours, prerequisites, icon_emoji, node_size, display_order, resource_page_url) VALUES
-- Existing: LLM, Prompting, Agents, Python (already in DB)

-- ML Libraries & Frameworks
('TensorFlow', 'TensorFlow', 'tensorflow', 'ai', 4, 35, '{Python}', '🧠', 25, 90, '/pages/tensorflow.html'),
('PyTorch', 'PyTorch', 'pytorch', 'ai', 4, 35, '{Python}', '🔥', 25, 91, '/pages/pytorch.html'),
('ScikitLearn', 'Scikit-Learn', 'scikit-learn', 'ai', 3, 25, '{Python}', '📊', 20, 92, '/pages/scikit.html'),
('Keras', 'Keras', 'keras', 'ai', 3, 20, '{Python,TensorFlow}', '🎯', 18, 93, '/pages/keras.html'),

-- AI Specializations
('ComputerVision', 'Computer Vision', 'computer-vision', 'ai', 4, 30, '{Python,TensorFlow}', '👁️', 22, 94, '/pages/cv.html'),
('NLP', 'Natural Language Processing', 'nlp', 'ai', 4, 28, '{Python}', '💬', 22, 95, '/pages/nlp.html'),
('RL', 'Reinforcement Learning', 'reinforcement-learning', 'ai', 5, 35, '{Python}', '🎮', 22, 96, '/pages/rl.html'),

-- AI Tools & Platforms
('HuggingFace', 'Hugging Face', 'huggingface', 'ai', 3, 20, '{Python,LLM}', '🤗', 20, 97, '/pages/huggingface.html'),
('LangChain', 'LangChain', 'langchain', 'ai', 3, 22, '{Python,LLM}', '🦜', 22, 98, '/pages/langchain.html'),
('OpenAI', 'OpenAI API', 'openai-api', 'ai', 2, 15, '{Python,Prompting}', '🤖', 20, 99, '/pages/openai.html'),
('MLOps', 'MLOps', 'mlops', 'ai', 4, 25, '{Python}', '⚙️', 20, 100, '/pages/mlops.html'),
('DataScience', 'Data Science', 'data-science', 'ai', 3, 40, '{Python}', '📈', 25, 101, '/pages/datascience.html')

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DEVOPS & CLOUD (15 topics)
-- ============================================

INSERT INTO learning_topics (id, name, slug, category, difficulty_level, estimated_hours, prerequisites, icon_emoji, node_size, display_order, resource_page_url) VALUES
('Docker', 'Docker', 'docker', 'devops', 3, 20, '{}', '🐳', 25, 110, '/pages/docker.html'),
('Kubernetes', 'Kubernetes', 'kubernetes', 'devops', 4, 35, '{Docker}', '☸️', 28, 111, '/pages/kubernetes.html'),
('Git', 'Git', 'git', 'devops', 2, 12, '{}', '🌿', 20, 112, '/pages/git.html'),
('GitHub', 'GitHub', 'github', 'devops', 2, 10, '{Git}', '🐙', 18, 113, '/pages/github.html'),
('CI/CD', 'CI/CD Pipelines', 'cicd', 'devops', 3, 20, '{Git}', '🔄', 20, 114, '/pages/cicd.html'),

-- Cloud Platforms
('AWS', 'Amazon Web Services', 'aws', 'devops', 4, 40, '{}', '☁️', 30, 115, '/pages/aws.html'),
('Azure', 'Microsoft Azure', 'azure', 'devops', 4, 38, '{}', '☁️', 28, 116, '/pages/azure.html'),
('GCP', 'Google Cloud Platform', 'gcp', 'devops', 4, 38, '{}', '☁️', 28, 117, '/pages/gcp.html'),

-- Infrastructure as Code
('Terraform', 'Terraform', 'terraform', 'devops', 4, 25, '{}', '🏗️', 22, 118, '/pages/terraform.html'),
('Ansible', 'Ansible', 'ansible', 'devops', 3, 22, '{}', '🔧', 20, 119, '/pages/ansible.html'),

-- Monitoring & Logging
('Prometheus', 'Prometheus', 'prometheus', 'devops', 3, 18, '{}', '🔥', 18, 120, '/pages/prometheus.html'),
('Grafana', 'Grafana', 'grafana', 'devops', 3, 15, '{Prometheus}', '📊', 18, 121, '/pages/grafana.html'),
('ELK', 'ELK Stack', 'elk-stack', 'devops', 4, 25, '{}', '🦌', 20, 122, '/pages/elk.html'),

-- Other DevOps Tools
('Nginx', 'Nginx', 'nginx', 'devops', 3, 15, '{}', '🟩', 18, 123, '/pages/nginx.html'),
('Linux', 'Linux', 'linux', 'devops', 3, 30, '{}', '🐧', 25, 124, '/pages/linux.html')

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- MOBILE DEVELOPMENT (8 topics)
-- ============================================

INSERT INTO learning_topics (id, name, slug, category, difficulty_level, estimated_hours, prerequisites, icon_emoji, node_size, display_order, resource_page_url) VALUES
('ReactNative', 'React Native', 'react-native', 'mobile', 3, 30, '{React,JS}', '📱', 25, 130, '/pages/react-native.html'),
('Flutter', 'Flutter', 'flutter', 'mobile', 3, 32, '{}', '🦋', 25, 131, '/pages/flutter.html'),
('Swift', 'Swift', 'swift', 'mobile', 3, 35, '{}', '🍎', 25, 132, '/pages/swift.html'),
('Kotlin', 'Kotlin', 'kotlin', 'mobile', 3, 30, '{}', '🤖', 25, 133, '/pages/kotlin.html'),
('iOS', 'iOS Development', 'ios', 'mobile', 4, 40, '{Swift}', '📱', 28, 134, '/pages/ios.html'),
('Android', 'Android Development', 'android', 'mobile', 4, 40, '{Kotlin}', '🤖', 28, 135, '/pages/android.html'),
('Expo', 'Expo', 'expo', 'mobile', 2, 15, '{ReactNative}', '⚡', 18, 136, '/pages/expo.html'),
('Ionic', 'Ionic', 'ionic', 'mobile', 3, 22, '{Angular}', '⚡', 20, 137, '/pages/ionic.html')

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DESIGN & UX (Already have Figma, UI, A11y)
-- Add more design tools
-- ============================================

INSERT INTO learning_topics (id, name, slug, category, difficulty_level, estimated_hours, prerequisites, icon_emoji, node_size, display_order, resource_page_url) VALUES
('Sketch', 'Sketch', 'sketch', 'design', 2, 15, '{}', '💎', 18, 140, '/pages/sketch.html'),
('AdobeXD', 'Adobe XD', 'adobe-xd', 'design', 2, 15, '{}', '🎨', 18, 141, '/pages/xd.html'),
('Photoshop', 'Photoshop', 'photoshop', 'design', 3, 25, '{}', '🖼️', 20, 142, '/pages/photoshop.html'),
('Illustrator', 'Illustrator', 'illustrator', 'design', 3, 25, '{}', '✏️', 20, 143, '/pages/illustrator.html'),
('Blender', 'Blender', 'blender', 'design', 4, 40, '{}', '🎨', 22, 144, '/pages/blender.html'),
('ThreeJS', 'Three.js', 'threejs', 'design', 4, 30, '{JS,WebGL}', '🎮', 22, 145, '/pages/threejs.html')

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- RELATIONSHIPS - Connect the new topics
-- ============================================

INSERT INTO topic_relationships (from_topic, to_topic, relationship_type, strength) VALUES
-- Frontend connections
('JS', 'Vue', 'prerequisite', 9),
('JS', 'Angular', 'prerequisite', 9),
('JS', 'Svelte', 'prerequisite', 9),
('Vue', 'Nuxt', 'prerequisite', 9),
('React', 'Remix', 'prerequisite', 9),
('React', 'ReactNative', 'prerequisite', 8),
('JS', 'Webpack', 'related', 7),
('JS', 'Vite', 'related', 7),
('CSS', 'Tailwind', 'prerequisite', 8),
('CSS', 'Sass', 'prerequisite', 7),
('CSS', 'Bootstrap', 'prerequisite', 7),
('JS', 'Jest', 'related', 8),
('React', 'Jest', 'related', 9),
('React', 'Cypress', 'related', 8),
('React', 'Playwright', 'related', 8),
('JS', 'GraphQL', 'related', 7),
('JS', 'REST', 'related', 8),

-- Backend connections
('JS', 'NodeJS', 'prerequisite', 9),
('NodeJS', 'Express', 'prerequisite', 9),
('NodeJS', 'NestJS', 'prerequisite', 9),
('Python', 'Django', 'prerequisite', 9),
('Python', 'FastAPI', 'prerequisite', 9),
('Ruby', 'Rails', 'prerequisite', 9),
('Java', 'Spring', 'prerequisite', 9),
('PHP', 'Laravel', 'prerequisite', 9),

-- Database connections
('SQL', 'PostgreSQL', 'prerequisite', 9),
('SQL', 'MySQL', 'prerequisite', 9),
('PostgreSQL', 'Supabase', 'prerequisite', 8),
('NodeJS', 'Prisma', 'prerequisite', 7),

-- AI connections
('Python', 'TensorFlow', 'prerequisite', 9),
('Python', 'PyTorch', 'prerequisite', 9),
('Python', 'ScikitLearn', 'prerequisite', 9),
('TensorFlow', 'Keras', 'prerequisite', 8),
('Python', 'NLP', 'prerequisite', 8),
('Python', 'ComputerVision', 'prerequisite', 8),
('LLM', 'LangChain', 'related', 9),
('LLM', 'HuggingFace', 'related', 9),
('Prompting', 'OpenAI', 'prerequisite', 8),

-- DevOps connections
('Docker', 'Kubernetes', 'prerequisite', 10),
('Git', 'GitHub', 'prerequisite', 9),
('Git', 'CI/CD', 'prerequisite', 8),
('Docker', 'AWS', 'related', 7),
('Docker', 'Azure', 'related', 7),
('Docker', 'GCP', 'related', 7),
('Prometheus', 'Grafana', 'prerequisite', 8),

-- Mobile connections
('ReactNative', 'Expo', 'prerequisite', 8),
('Swift', 'iOS', 'prerequisite', 10),
('Kotlin', 'Android', 'prerequisite', 10),
('Angular', 'Ionic', 'prerequisite', 8),

-- Design connections
('UI', 'Sketch', 'related', 6),
('UI', 'AdobeXD', 'related', 6),
('JS', 'ThreeJS', 'prerequisite', 7),
('WebGL', 'ThreeJS', 'prerequisite', 8)

ON CONFLICT (from_topic, to_topic) DO NOTHING;

-- ============================================
-- SUMMARY
-- ============================================
-- Total topics after running this:
-- Web: 20 topics
-- Backend: 15 topics  
-- Databases: 10 topics
-- AI/ML: 12 topics
-- DevOps: 15 topics
-- Mobile: 8 topics
-- Design: 6 additional topics
-- ============================================
-- TOTAL: 86 topics (includes original 14)
-- ============================================

-- To verify:
SELECT category, COUNT(*) as topic_count 
FROM learning_topics 
GROUP BY category 
ORDER BY topic_count DESC;
