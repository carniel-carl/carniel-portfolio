import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Seed admin user
  const hashedPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || "admin123",
    12
  );

  await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || "admin@example.com" },
    update: { isAdmin: true },
    create: {
      email: process.env.ADMIN_EMAIL || "admin@example.com",
      name: "Admin",
      password: hashedPassword,
      isAdmin: true,
    },
  });
  console.log("✓ Admin user seeded");

  // Seed About
  const existingAbout = await prisma.about.findFirst();
  if (!existingAbout) {
    await prisma.about.create({
      data: {
        bio: "<p>I discovered my passion for coding while building a website for my art business. Since then, I have immersed myself in the world of technology, continuously expanding my skills and exploring its vast potential. Combining creativity with functionality, makes my journey in tech both fulfilling and dynamic.</p>",
        profilePicUrl: "/images/profile-pic.jpg",
        resumeUrl: "/chimezie-resume.pdf",
      },
    });
    console.log("✓ About section seeded");
  }

  // Seed Projects
  const projectCount = await prisma.project.count();
  if (projectCount === 0) {
    const projects = [
      {
        tag: "Blog",
        name: "Creator Economy IQ",
        img: "/images/projects/jollofdiary.png",
        live: "https://www.creatoreconomyiq.com/",
        description:
          "Creator Economy IQ is a premier data and business insights resource platform, illuminating the business and commercial aspects of the African creator economy.",
        stack: [
          "Nextjs",
          "TailwindCss",
          "Typescript",
          "Prisma",
          "MongoDb",
          "NextAuth",
          "Disqus",
        ],
        featured: true,
        order: 0,
      },
      {
        tag: "ECommerce",
        name: "Othrika",
        img: "/images/projects/othrika.png",
        live: "https://othrika.com/",
        description:
          "Make money selling old clothes/thrifts online with Othrika Ecommerce platform, managed by a custom built inventory admin dashboard.",
        stack: [
          "Nextjs",
          "Typescript",
          "NextAuth",
          "Google Auth",
          "TailwindCss",
          "ShadCn",
          "MongoDb",
          "Prisma",
          "Paystack",
        ],
        featured: true,
        order: 1,
      },
      {
        tag: "Landing",
        name: "TechnoClean Dry Cleaners",
        img: "/images/projects/technoclean.png",
        live: "https://technocleanltd.com/",
        description:
          "A professional dry cleaning and laundry service website that offers convenient online booking, eco-friendly cleaning methods, and doorstep pickup and delivery for a seamless customer experience.",
        stack: [
          "Nextjs",
          "TailwindCss",
          "Typescript",
          "ShadCn",
          "NextAuth",
          "motion/react",
        ],
        featured: true,
        order: 2,
      },
      {
        tag: "ECommerce",
        name: "Greens review",
        img: "/images/projects/greens.png",
        live: "https://greensreviews.vercel.app/",
        code: "https://github.com/carniel-carl/greenspace",
        description:
          "An Ecommerce platform to sell phone cables, managed by a custom built inventory admin dashboard.",
        stack: [
          "Nextjs",
          "TailwindCss",
          "Typescript",
          "ShadCn",
          "NextAuth",
          "MongoDb",
          "Prisma",
        ],
        featured: true,
        order: 3,
      },
      {
        tag: "Landing",
        name: "Zubion Logistics",
        img: "/images/projects/zubion.png",
        live: "https://www.zubionlogistics.com/",
        code: "https://github.com/carniel-carl/zubion",
        description:
          "Looking for a way to save time and money on your Amazon business? Zubion Logistics FBA fulfillment services take care of everything from picking and packing to shipping to your customers",
        stack: ["Nextjs", "TailwindCss", "Typescript", "ShadCn", "Google Form"],
        featured: true,
        order: 4,
      },
      {
        tag: "Web3",
        name: "Pouch Swap",
        img: "/images/projects/pouchswap.png",
        live: "https://www.pouchswap.com/",
        code: "https://github.com/Bravark/pouch-swap-web",
        description:
          "The fastest, safest and cheapest token swapping and bridging protocol.",
        stack: ["Nextjs", "TailwindCss", "Typescript", "ShadCn"],
        featured: true,
        order: 5,
      },
      {
        name: "Todo App",
        img: "/images/projects/todo.png",
        live: "https://todo-carniel-app.vercel.app/",
        code: "https://github.com/carniel-carl/todo",
        description:
          "A Demo project built with react for task management with persistent data storage.",
        featured: false,
        order: 0,
        stack: [],
      },
    ];

    for (const project of projects) {
      await prisma.project.create({ data: project });
    }
    console.log("✓ Projects seeded");
  }

  // Seed Skills
  const skillCount = await prisma.skill.count();
  if (skillCount === 0) {
    const skills = [
      { title: "React", iconName: "FaReact", iconLib: "fa", order: 0 },
      { title: "React Router", iconName: "SiReactrouter", iconLib: "si", order: 1 },
      { title: "NextJs", iconName: "SiNextdotjs", iconLib: "si", order: 2 },
      { title: "JavaScript", iconName: "BiLogoJavascript", iconLib: "bi", order: 3 },
      { title: "TypeScript", iconName: "SiTypescript", iconLib: "si", order: 4 },
      { title: "Jest", iconName: "SiJest", iconLib: "si", order: 5 },
      { title: "Redux", iconName: "SiRedux", iconLib: "si", order: 6 },
      { title: "HTML", iconName: "BiLogoHtml5", iconLib: "bi", order: 7 },
      { title: "CSS", iconName: "BiLogoCss3", iconLib: "bi", order: 8 },
      { title: "SASS", iconName: "SiSass", iconLib: "si", order: 9 },
      { title: "TailwindCSS", iconName: "SiTailwindcss", iconLib: "si", order: 10 },
      { title: "Python", iconName: "FaPython", iconLib: "fa", order: 11 },
      { title: "Django", iconName: "BiLogoDjango", iconLib: "bi", order: 12 },
      { title: "Node", iconName: "BiLogoNodejs", iconLib: "bi", order: 13 },
      { title: "Firebase", iconName: "BiLogoFirebase", iconLib: "bi", order: 14 },
      { title: "Webpack", iconName: "SiWebpack", iconLib: "si", order: 15 },
      { title: "SQL", iconName: "PiFileSql", iconLib: "pi", order: 16 },
      { title: "SQLite", iconName: "SiSqlite", iconLib: "si", order: 17 },
      { title: "PostgresSQL", iconName: "BiLogoPostgresql", iconLib: "bi", order: 18 },
      { title: "MongoDB", iconName: "BiLogoMongodb", iconLib: "bi", order: 19 },
      { title: "Git", iconName: "BsGit", iconLib: "bs", order: 20 },
      { title: "GitHub", iconName: "BsGithub", iconLib: "bs", order: 21 },
    ];

    for (const skill of skills) {
      await prisma.skill.create({ data: skill });
    }
    console.log("✓ Skills seeded");
  }

  // Seed Social Links
  const socialCount = await prisma.socialLink.count();
  if (socialCount === 0) {
    const socialLinks = [
      { name: "linkedin", link: "https://www.linkedin.com/in/carniel1/" },
      { name: "github", link: "https://github.com/carniel-carl" },
      { name: "twitter", link: "https://twitter.com/dripcarniel" },
      { name: "instagram", link: "instagram://user?username=carniel_carl" },
    ];

    for (const social of socialLinks) {
      await prisma.socialLink.create({ data: social });
    }
    console.log("✓ Social links seeded");
  }

  console.log("\nSeed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
