package de.tum.aet.devops25.conceptsvc;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class ConceptSvc {

	public static void main(String[] args) {
		SpringApplication.run(ConceptSvc.class, args);
	}

}
