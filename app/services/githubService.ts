import { message } from 'antd';

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string;
  default_branch: string;
}

interface GitHubWebhook {
  id: number;
  name: string;
  active: boolean;
  events: string[];
  config: {
    url: string;
    content_type: string;
    insecure_ssl: string;
  };
}

export const githubService = {
  async getRepositories(token: string): Promise<GitHubRepository[]> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_GITHUB_API_URL}/user/repos`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching repositories:', error);
      message.error('Error al obtener los repositorios de GitHub');
      throw error;
    }
  },

  async getWebhooks(token: string, owner: string, repo: string): Promise<GitHubWebhook[]> {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_GITHUB_API_URL}/repos/${owner}/${repo}/hooks`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch webhooks');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      message.error('Error al obtener los webhooks del repositorio');
      throw error;
    }
  },

  async createWebhook(
    token: string,
    owner: string,
    repo: string,
    webhookUrl: string,
    events: string[] = ['push', 'pull_request']
  ): Promise<GitHubWebhook> {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_GITHUB_API_URL}/repos/${owner}/${repo}/hooks`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'web',
            active: true,
            events,
            config: {
              url: webhookUrl,
              content_type: 'json',
              secret: process.env.GITHUB_WEBHOOK_SECRET
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create webhook');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating webhook:', error);
      message.error('Error al crear el webhook');
      throw error;
    }
  },

  async deleteWebhook(
    token: string,
    owner: string,
    repo: string,
    hookId: number
  ): Promise<void> {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_GITHUB_API_URL}/repos/${owner}/${repo}/hooks/${hookId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete webhook');
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
      message.error('Error al eliminar el webhook');
      throw error;
    }
  },

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_GITHUB_API_URL}/user`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }
}; 