package de.tum.aet.devops25.conceptsvc;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

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
    }
} 