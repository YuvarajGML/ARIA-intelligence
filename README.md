# Insight Weaver

A modern full-stack web application built with **TanStack Start**, **React**, **TypeScript**, and **Tailwind CSS**. This project provides a foundation for building interactive, type-safe web applications with server-side rendering capabilities and a component-rich UI.

## 🚀 Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start/latest) - Full-stack React framework
- **Language**: TypeScript
- **UI Framework**: React 19
- **Routing**: TanStack React Router
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS with custom animations
- **Form Handling**: React Hook Form with Zod validation
- **Component Library**: Radix UI (comprehensive accessible components)
- **Database**: Supabase
- **Build Tool**: Vite
- **Charts**: Recharts
- **Icons**: Lucide React
- **Code Quality**: ESLint + Prettier

## 📋 Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm package manager

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/YuvarajGML/insight-weaver.git
cd insight-weaver

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

## 📚 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build in development mode
npm run build:dev

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

## 🏗️ Project Structure

```
insight-weaver/
├── src/
│   ├── components/      # React components
│   ├── routes/          # TanStack Router routes
│   ├── api/             # API handlers
│   └── utils/           # Utility functions
├── public/              # Static assets
├── package.json         # Project dependencies
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
└── tailwind.config.js   # Tailwind CSS configuration
```

## 🎨 UI Components

This project includes a complete set of Radix UI components:

- Accordion, Alert Dialog, Avatar
- Checkbox, Collapsible, Context Menu, Dialog
- Dropdown Menu, Hover Card, Label
- Menubar, Navigation Menu, Popover, Progress
- Radio Group, Scroll Area, Select, Separator
- Slider, Switch, Tabs, Toggle, Tooltip

All components are styled with Tailwind CSS for a consistent design system.

## 📦 Key Dependencies

### Core
- `@tanstack/react-start` - Full-stack framework
- `@tanstack/react-router` - Type-safe routing
- `@tanstack/react-query` - Server state management

### UI & Forms
- `@radix-ui/*` - Accessible component library
- `react-hook-form` - Flexible form handling
- `zod` - TypeScript-first schema validation
- `tailwindcss` - Utility-first CSS framework

### Data & Visualization
- `recharts` - Composable charting library
- `@supabase/supabase-js` - Database and auth

### Utilities
- `date-fns` - Date manipulation
- `lucide-react` - Icon library
- `class-variance-authority` - Component variants
- `sonner` - Toast notifications

## 🚀 Getting Started

1. **Set up environment variables** (if needed):
   ```bash
   # Create a .env.local file with your configuration
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   - Navigate to `http://localhost:5173` (or the port shown in terminal)

4. **Start building**:
   - Add routes in `src/routes/`
   - Create components in `src/components/`
   - Extend the UI with more Radix components as needed

## 🔧 Configuration

### TypeScript
- Configured with strict mode enabled
- Full type safety across the application

### Tailwind CSS
- Extended with custom animations and plugins
- Tailwind UI integration ready

### ESLint & Prettier
- Ensures code quality and consistency
- Run `npm run format` to auto-format code

## 🌐 Deployment

### Cloudflare
This project includes Cloudflare integration via `@cloudflare/vite-plugin`. To deploy:

```bash
npm run build
# Deploy to Cloudflare Pages or Workers
```

## 📖 Documentation

- [TanStack Start Docs](https://tanstack.com/start/latest)
- [TanStack Router Docs](https://tanstack.com/router/latest)
- [TanStack React Query Docs](https://tanstack.com/query/latest)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📝 License

This project is private. Please contact the repository owner for licensing information.

## 👤 Author

- GitHub: [@YuvarajGML](https://github.com/YuvarajGML)

---

**Happy coding! 🎉**
