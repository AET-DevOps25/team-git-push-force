package de.tum.aet.devops25.conceptsvc;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class ConceptSvcTest {

	@Test
	void contextLoads() {
		// This test verifies that the Spring Boot application context loads successfully
		// with the test configuration (H2 in-memory database)
	}

}
