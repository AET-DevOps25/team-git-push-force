package de.tum.aet.devops25;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.config.CorsRegistry;
import org.springframework.web.reactive.config.EnableWebFlux;
import org.springframework.web.reactive.config.WebFluxConfigurer;

@Configuration
@EnableWebFlux
public class CorsConfig implements WebFluxConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                    "http://localhost:3000", 
                    "http://localhost:4200", 
                    "https://dev-aieventconcepter.student.k8s.aet.cit.tum.de", 
                    "https://aieventconcepter.student.k8s.aet.cit.tum.de"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Authorization", "Content-Type")
                .maxAge(3600) // Cache preflight requests for 1 hour
                .allowCredentials(true);

        // Add specific mapping for /api path to ensure it works with the ingress configuration
        registry.addMapping("/api/**")
                .allowedOrigins(
                    "http://localhost:3000", 
                    "http://localhost:4200", 
                    "https://dev-aieventconcepter.student.k8s.aet.cit.tum.de", 
                    "https://aieventconcepter.student.k8s.aet.cit.tum.de"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Authorization", "Content-Type")
                .maxAge(3600)
                .allowCredentials(true);
    }
}
