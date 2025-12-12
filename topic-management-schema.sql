-- ============================================
-- TOPIC MANAGEMENT SYSTEM
-- Makes adding/editing topics easy without code changes
-- ============================================

-- Table: Learning Topics (Master List)
CREATE TABLE IF NOT EXISTS learning_topics (
    id TEXT PRIMARY KEY,  -- Short ID like 'React', 'Python'
    name TEXT NOT NULL,  -- Display name like 'React.js'
    slug TEXT UNIQUE,  -- URL-friendly like 'react-js'
    description TEXT,
    category TEXT NOT NULL,  -- 'web', 'ai', 'design', 'backend', 'mobile', 'devops'
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),  -- 1=beginner, 5=expert
    estimated_hours DECIMAL(5,2),
    prerequisites TEXT[],  -- Array of topic IDs that should be learned first
    icon_emoji TEXT DEFAULT '📚',
    color_hex TEXT DEFAULT '#4c8bf5',
    node_size INTEGER DEFAULT 20,
    display_order INTEGER,
    is_published BOOLEAN DEFAULT true,
    resource_page_url TEXT,  -- Link to /pages/{slug}.html
    external_url TEXT,  -- Optional external resource
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: Topic Relationships (Custom Links)
CREATE TABLE IF NOT EXISTS topic_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_topic TEXT REFERENCES learning_topics(id) ON DELETE CASCADE,
    to_topic TEXT REFERENCES learning_topics(id) ON DELETE CASCADE,
    relationship_type TEXT DEFAULT 'prerequisite',  -- 'prerequisite', 'related', 'alternative'
    strength INTEGER CHECK (strength BETWEEN 1 AND 10) DEFAULT 5,  -- How strong the connection
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_topic, to_topic)
);

-- Table: Topic Categories (Clusters)
CREATE TABLE IF NOT EXISTS topic_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color_hex TEXT DEFAULT '#4c8bf5',
    icon_emoji TEXT DEFAULT '📁',
    display_order INTEGER,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_topics_category ON learning_topics(category);
CREATE INDEX IF NOT EXISTS idx_topics_published ON learning_topics(is_published);
CREATE INDEX IF NOT EXISTS idx_topics_display_order ON learning_topics(display_order);
CREATE INDEX IF NOT EXISTS idx_relationships_from ON topic_relationships(from_topic);
CREATE INDEX IF NOT EXISTS idx_relationships_to ON topic_relationships(to_topic);

-- RLS Policies
ALTER TABLE learning_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read published topics
DROP POLICY IF EXISTS "Anyone can view published topics" ON learning_topics;
CREATE POLICY "Anyone can view published topics"
    ON learning_topics FOR SELECT
    USING (is_published = true);

-- Anyone can view relationships
DROP POLICY IF EXISTS "Anyone can view relationships" ON topic_relationships;
CREATE POLICY "Anyone can view relationships"
    ON topic_relationships FOR SELECT
    USING (true);

-- Anyone can view categories
DROP POLICY IF EXISTS "Anyone can view categories" ON topic_categories;
CREATE POLICY "Anyone can view categories"
    ON topic_categories FOR SELECT
    USING (is_visible = true);

-- ============================================
-- SEED DATA - Starting Topics
-- ============================================

-- Categories
INSERT INTO topic_categories (id, name, description, color_hex, icon_emoji, display_order) VALUES
('web', 'Web Development', 'Frontend web technologies', '#4c8bf5', '🌐', 1),
('ai', 'AI & Machine Learning', 'Artificial intelligence and LLMs', '#d367c1', '🤖', 2),
('design', 'Design & UX', 'User interface and experience', '#ff6b9d', '🎨', 3),
('backend', 'Backend Development', 'Server-side technologies', '#00ff88', '⚙️', 4),
('mobile', 'Mobile Development', 'iOS and Android apps', '#ffdd00', '📱', 5),
('devops', 'DevOps & Cloud', 'Infrastructure and deployment', '#ff9800', '☁️', 6)
ON CONFLICT (id) DO NOTHING;

-- Current 13 Topics
INSERT INTO learning_topics (id, name, slug, description, category, difficulty_level, estimated_hours, prerequisites, icon_emoji, node_size, display_order, resource_page_url) VALUES
('CLH', 'CLH Hub', 'clh-hub', 'Central hub connecting all learning paths', 'web', 1, 0, '{}', '🌟', 100, 0, '/index.html'),
('React', 'React.js', 'react-js', 'Popular JavaScript library for building UIs', 'web', 3, 35, '{JS}', '⚛️', 30, 1, '/pages/react.html'),
('HTML', 'HTML5', 'html5', 'Markup language for web pages', 'web', 1, 8, '{}', '📄', 20, 2, '/pages/html.html'),
('CSS', 'CSS3', 'css3', 'Styling language for web pages', 'web', 2, 12, '{HTML}', '🎨', 20, 3, '/pages/css.html'),
('JS', 'JavaScript', 'javascript', 'Programming language for web interactivity', 'web', 2, 40, '{HTML,CSS}', '📜', 30, 4, '/pages/js.html'),
('NextJS', 'Next.js', 'nextjs', 'React framework for production', 'web', 4, 20, '{React,JS}', '▲', 20, 5, '/pages/nextjs.html'),
('TS', 'TypeScript', 'typescript', 'Typed superset of JavaScript', 'web', 3, 25, '{JS}', '📘', 20, 6, '/pages/ts.html'),
('LLM', 'Large Language Models', 'llms', 'AI models like GPT and Claude', 'ai', 3, 30, '{Python}', '🧠', 30, 7, '/pages/llm.html'),
('Prompting', 'Prompt Engineering', 'prompting', 'Effective communication with AI', 'ai', 2, 15, '{LLM}', '💬', 20, 8, '/pages/prompting.html'),
('Agents', 'AI Agents', 'ai-agents', 'Autonomous AI systems', 'ai', 4, 25, '{LLM,Prompting}', '🤖', 25, 9, '/pages/agents.html'),
('Python', 'Python', 'python', 'Versatile programming language', 'backend', 2, 30, '{}', '🐍', 20, 10, '/pages/python.html'),
('Figma', 'Figma', 'figma', 'Collaborative design tool', 'design', 2, 15, '{}', '🎨', 20, 11, '/pages/figma.html'),
('UI', 'UI/UX Design', 'ui-ux', 'User interface and experience design', 'design', 3, 20, '{Figma}', '✨', 20, 12, '/pages/ui.html'),
('A11y', 'Accessibility', 'accessibility', 'Making web accessible to all', 'design', 3, 15, '{HTML,CSS}', '♿', 15, 13, '/pages/a11y.html')
ON CONFLICT (id) DO NOTHING;

-- Relationships (Prerequisites)
INSERT INTO topic_relationships (from_topic, to_topic, relationship_type, strength) VALUES
('CLH', 'React', 'pathway', 8),
('CLH', 'LLM', 'pathway', 8),
('CLH', 'UI', 'pathway', 8),
('React', 'JS', 'prerequisite', 10),
('React', 'NextJS', 'prerequisite', 9),
('JS', 'TS', 'related', 8),
('HTML', 'CSS', 'prerequisite', 9),
('CSS', 'UI', 'related', 7),
('LLM', 'Agents', 'prerequisite', 9),
('LLM', 'Prompting', 'prerequisite', 8),
('LLM', 'Python', 'related', 7),
('Python', 'JS', 'alternative', 5),
('UI', 'Figma', 'related', 8),
('UI', 'A11y', 'related', 7)
ON CONFLICT (from_topic, to_topic) DO NOTHING;

-- ============================================
-- EXAMPLE: Adding New Topics
-- ============================================

-- Add Vue.js (Alternative to React)
INSERT INTO learning_topics (id, name, slug, description, category, difficulty_level, estimated_hours, prerequisites, icon_emoji, node_size, display_order, resource_page_url)
VALUES ('Vue', 'Vue.js', 'vue-js', 'Progressive JavaScript framework', 'web', 3, 30, '{JS}', '🟢', 25, 14, '/pages/vue.html')
ON CONFLICT (id) DO NOTHING;

-- Add Docker (DevOps)
INSERT INTO learning_topics (id, name, slug, description, category, difficulty_level, estimated_hours, prerequisites, icon_emoji, node_size, display_order, resource_page_url)
VALUES ('Docker', 'Docker', 'docker', 'Container platform', 'devops', 3, 20, '{}', '🐳', 20, 15, '/pages/docker.html')
ON CONFLICT (id) DO NOTHING;

-- Add MongoDB (Backend)
INSERT INTO learning_topics (id, name, slug, description, category, difficulty_level, estimated_hours, prerequisites, icon_emoji, node_size, display_order, resource_page_url)
VALUES ('MongoDB', 'MongoDB', 'mongodb', 'NoSQL database', 'backend', 3, 18, '{JS}', '🍃', 20, 16, '/pages/mongodb.html')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VIEWS - Easy Queries
-- ============================================

-- View: All published topics with category info
CREATE OR REPLACE VIEW topics_with_categories AS
SELECT 
    t.*,
    c.name as category_name,
    c.color_hex as category_color,
    c.icon_emoji as category_icon
FROM learning_topics t
LEFT JOIN topic_categories c ON t.category = c.id
WHERE t.is_published = true
ORDER BY t.display_order;

-- View: Topic with prerequisite count
CREATE OR REPLACE VIEW topics_with_prereq_count AS
SELECT 
    t.*,
    COUNT(r.id) as prerequisite_count
FROM learning_topics t
LEFT JOIN topic_relationships r ON t.id = r.to_topic AND r.relationship_type = 'prerequisite'
GROUP BY t.id
ORDER BY t.display_order;

-- View: Suggested learning paths (most common sequences)
CREATE OR REPLACE VIEW suggested_paths AS
SELECT 
    from_topic,
    t1.name as from_name,
    to_topic,
    t2.name as to_name,
    COUNT(*) as times_taken,
    AVG(days_between) as avg_days_between
FROM learning_pathways lp
JOIN learning_topics t1 ON lp.from_topic = t1.id
JOIN learning_topics t2 ON lp.to_topic = t2.id
GROUP BY from_topic, t1.name, to_topic, t2.name
HAVING COUNT(*) >= 2
ORDER BY times_taken DESC;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Get recommended topics for user
CREATE OR REPLACE FUNCTION get_recommended_topics(p_user_id UUID)
RETURNS TABLE (
    topic_id TEXT,
    topic_name TEXT,
    reason TEXT,
    confidence INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH completed AS (
        SELECT node_id 
        FROM user_progress 
        WHERE user_id = p_user_id AND status = 'completed'
    )
    SELECT 
        t.id,
        t.name,
        'Prerequisites completed' as reason,
        80 as confidence
    FROM learning_topics t
    WHERE t.id NOT IN (SELECT node_id FROM completed)
      AND t.is_published = true
      AND (t.prerequisites IS NULL OR t.prerequisites <@ ARRAY(SELECT node_id FROM completed))
    ORDER BY t.difficulty_level, t.display_order
    LIMIT 3;
END;
$$ LANGUAGE plpgsql;

-- Function: Get topic cluster (topics in same category)
CREATE OR REPLACE FUNCTION get_topic_cluster(p_category TEXT)
RETURNS TABLE (
    topic_id TEXT,
    topic_name TEXT,
    difficulty INTEGER,
    estimated_hours DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT id, name, difficulty_level, estimated_hours
    FROM learning_topics
    WHERE category = p_category AND is_published = true
    ORDER BY display_order;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS - Auto-update timestamps
-- ============================================

CREATE OR REPLACE FUNCTION update_topic_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_topic_timestamp ON learning_topics;
CREATE TRIGGER trigger_update_topic_timestamp
    BEFORE UPDATE ON learning_topics
    FOR EACH ROW
    EXECUTE FUNCTION update_topic_timestamp();
