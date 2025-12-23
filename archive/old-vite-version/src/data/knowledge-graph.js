// Galaxy visual groups with colors
export const GROUPS = {
    WEB: { id: 1, color: '#4c8bf5' },  // Title Blue
    AI: { id: 2, color: '#d367c1' },   // Title Pink
    DESIGN: { id: 3, color: '#a060ff' }, // Purple/Violet blend
    COMMUNITY: { id: 4, color: '#ffffff' } // Bright White Core
};

// Knowledge graph data
export const graphData = {
    nodes: [
        { 
            id: 'CLH', 
            group: 4, 
            val: 200, 
            name: 'CLH HUB', 
            desc: 'The heart of our community. Connect, share, and grow.',
            hasPage: false,
            isCenter: true
        },
        { 
            id: 'React', 
            group: 1, 
            val: 30, 
            name: 'React.js', 
            desc: 'Modern UI library for building interactive interfaces.',
            hasPage: true
        },
        { 
            id: 'HTML', 
            group: 1, 
            val: 20, 
            name: 'HTML5', 
            desc: 'The structural foundation of the web.',
            hasPage: true
        },
        { 
            id: 'CSS', 
            group: 1, 
            val: 20, 
            name: 'CSS3', 
            desc: 'Styling and layout mastery.',
            hasPage: true
        },
        { 
            id: 'JS', 
            group: 1, 
            val: 30, 
            name: 'JavaScript', 
            desc: 'The language that powers the web.',
            hasPage: true
        },
        { 
            id: 'NextJS', 
            group: 1, 
            val: 20, 
            name: 'Next.js', 
            desc: 'The React Framework for production.',
            hasPage: true
        },
        { 
            id: 'TS', 
            group: 1, 
            val: 20, 
            name: 'TypeScript', 
            desc: 'JavaScript with syntax for types.',
            hasPage: true
        },
        { 
            id: 'LLM', 
            group: 2, 
            val: 30, 
            name: 'LLMs', 
            desc: 'Large Language Models redefining intelligence.',
            hasPage: true
        },
        { 
            id: 'Prompting', 
            group: 2, 
            val: 20, 
            name: 'Prompting', 
            desc: 'The art of communicating with AI.',
            hasPage: true
        },
        { 
            id: 'Agents', 
            group: 2, 
            val: 25, 
            name: 'AI Agents', 
            desc: 'Autonomous systems that take action.',
            hasPage: true
        },
        { 
            id: 'Python', 
            group: 2, 
            val: 20, 
            name: 'Python', 
            desc: 'Versatile language for AI and backend.',
            hasPage: true
        },
        { 
            id: 'Figma', 
            group: 3, 
            val: 20, 
            name: 'Figma', 
            desc: 'Collaborative interface design tool.',
            hasPage: true
        },
        { 
            id: 'UI', 
            group: 3, 
            val: 20, 
            name: 'UI / UX', 
            desc: 'User Interface and Experience Design.',
            hasPage: true
        },
        { 
            id: 'A11y', 
            group: 3, 
            val: 15, 
            name: 'Accessibility', 
            desc: 'Building for everyone, everywhere.',
            hasPage: true
        }
    ],
    links: [
        { source: 'CLH', target: 'React' }, 
        { source: 'CLH', target: 'LLM' }, 
        { source: 'CLH', target: 'UI' },
        { source: 'React', target: 'JS' }, 
        { source: 'React', target: 'NextJS' }, 
        { source: 'JS', target: 'TS' },
        { source: 'HTML', target: 'CSS' }, 
        { source: 'CSS', target: 'UI' },
        { source: 'LLM', target: 'Agents' }, 
        { source: 'LLM', target: 'Prompting' }, 
        { source: 'LLM', target: 'Python' },
        { source: 'Python', target: 'JS' }, 
        { source: 'UI', target: 'Figma' }, 
        { source: 'UI', target: 'A11y' }
    ]
};

// Helper function to get node color by group
export function getNodeColor(node) {
    if (node.group === 1) return GROUPS.WEB.color;
    if (node.group === 2) return GROUPS.AI.color;
    if (node.group === 3) return GROUPS.DESIGN.color;
    if (node.group === 4) return GROUPS.COMMUNITY.color;
    return '#fff';
}
