import React from "react";
import { Github } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-card/30 px-2 py-2 md:px-3">
      <div className="w-full text-center text-xs text-muted-foreground">
        Created by{" "}
        <a
          href="https://github.com/nigoh"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-foreground"
        >
          <Github className="h-3.5 w-3.5" />
          nigoh
        </a>
      </div>
    </footer>
  );
};

export default Footer;
