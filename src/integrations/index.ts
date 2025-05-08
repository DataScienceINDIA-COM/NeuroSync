tsx
import { Automation } from "@/types/automation";

class IntegrationService {
    private integrations: Automation[] = [];

    constructor() {
        this.loadIntegrations();
    }

    private saveIntegrations() {
        localStorage.setItem("integrations", JSON.stringify(this.integrations));
    }

    private loadIntegrations() {
        const storedIntegrations = localStorage.getItem("integrations");
        if (storedIntegrations) {
            this.integrations = JSON.parse(storedIntegrations);
        }
    }

    getIntegrations(): Automation[] {
        return this.integrations;
    }
}

export default IntegrationService;